<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchMenu, setOrder } from './api';
import ResPopup from './components/ResPopup.vue';
import StartPopup from './components/startPopup.vue';

const isSpeeck = ref(false);
const recognizedText = ref('');
const permissionDenied = ref(false);
const permissionRequested = ref(false);
const recognitionRef = ref(null); // recognition 인스턴스를 저장할 ref

const menu = ref([]);
const orderAnswer = ref(''); // 음성 인식 결과를 저장할 ref
const isLoading = ref(false);

const popupVisible = ref(false);

const baseUrl = import.meta.env.VITE_BASE_URL;

const orderArr = ref([]);

onMounted(() => {
  console.log(import.meta.env.VITE_BASE_URL);

  fetchMenu().then((res) => {
    console.log('메뉴:', res);
    menu.value = res.data;
  });

  setOrder({ prompt: '', order: [] }).then((res) => {
    console.log('주문 초기화 결과:', res);
  });
});

let silenceTimeout;

let finalTranscript = ''; // 최종 텍스트를 누적
let interimTranscript = ''; // 중간 텍스트를 누적

const startRecognition = async () => {
  const isPermissionGranted = await requestMicrophonePermission();

  if (!isPermissionGranted) {
    permissionRequested.value = true;
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('이 브라우저에서는 음성 인식 기능을 사용할 수 없습니다.');
    return;
  }

  const recognition = new SpeechRecognition();
  console.log('recognition', recognition);
  recognitionRef.value = recognition; // 외부에서 접근 가능하게 저장
  recognition.lang = 'ko-KR';
  recognition.continuous = true; // 음성 인식이 끊기지 않게 설정
  recognition.interimResults = true; // 중간 결과도 계속해서 반환하도록 설정

  recognition.onresult = (event) => {
    // 중간 결과 및 최종 결과를 처리
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      //console.log('음성인식 말', transcript);

      // 최종 결과 처리
      if (event.results[i].isFinal) {
        console.log('event.results[i].isFinal', event.results[i].isFinal);
        finalTranscript += transcript + ' '; // 최종 결과에 추가
        interimTranscript = ''; // 중간 결과는 초기화 (최종 결과가 나오면 중간 결과 지우기)
      } else {
        interimTranscript = transcript; // 중간 결과에 추가
      }
    }

    console.log('붙여1', finalTranscript);
    console.log('붙여2', interimTranscript);

    // 최종 텍스트 + 현재 중간 텍스트를 이어서 표시
    recognizedText.value = finalTranscript + interimTranscript;

    resetSilenceTimer(); // 음성 감지 후 타이머 리셋
  };

  recognition.onaudiostart = () => {
    console.log('음성 인식 시작');
    resetSilenceTimer(); // 음성 인식 시작 시 타이머 초기화
    isSpeeck.value = true; // 음성 인식 시작 시 true로 설정
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service not allowed') {
      permissionDenied.value = true;
      console.log('마이크 권한이 거부되었습니다.');
    }
  };

  recognition.start();
  console.log('음성 인식 시작됨...');

  const resetSilenceTimer = () => {
    clearTimeout(silenceTimeout);
    silenceTimeout = setTimeout(() => {
      recognition.stop();
      console.log('⏹ 음성이 없어서 인식 중단됨.');
      sendVoiceOrder(); // 음성이 없을 때 주문 전송
      isSpeeck.value = false; //아이콘 변경
    }, 2500); // 2.5초
  };
};

const stopRecognition = () => {
  if (recognitionRef.value) {
    recognitionRef.value.stop();
    console.log('음성 인식 멈춤');
  }
};

const requestMicrophonePermission = () => {
  return new Promise((resolve) => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then(() => resolve(true))
        .catch((err) => {
          console.log('마이크 권한이 거부되었습니다:', err);
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
};

const clearRecognizedText = () => {
  recognizedText.value = '';
  finalTranscript = '';
  interimTranscript = '';
};

const category = ref('햄버거');
const categories = ['햄버거', '사이드메뉴'];
const categoryLabels = {
  햄버거: 'BURGERS & MEALS',
  사이드메뉴: 'SNACKS & SIDES',
};

const cart = ref([]);

const addToCart = (item) => {
  console.log('raw item ::: ', item);
  if (Array.isArray(item)) {
    // item이 배열일 경우: 각각의 요소에 대해 addToCart 재귀 호출
    cart.value = []; // 실제 서비스라면 이렇게 비우면 안됨

    item.forEach((it) => addToCart(it));
  } else {
    //직접 담은 경우
    if (typeof item === 'object' && item !== null) {
      const existingItem = cart.value.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        if (!item.quantity) {
          item.quantity = 1; // 수량을 1로 초기화
        }
        cart.value.push(item);
      }
      return;
    }

    // item이 객체일 경우 (orderAnswer에서 온 경우)
    cart.value.push(item);
  }

  console.log('CART ::: ', cart.value);
};

const clearCart = () => {
  cart.value = [];
};

const totalPrice = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const sendVoiceOrder = () => {
  stopRecognition();
  isLoading.value = true;
  console.log('recognizedText', recognizedText.value);
  setOrder({ prompt: recognizedText.value, order: orderArr.value }).then((res) => {
    console.log('주문 결과:', res);
    orderAnswer.value = res.data;
    orderArr.value = res.data.order;

    clearRecognizedText();

    isLoading.value = false;
    popupVisible.value = true;

    finalTranscript = '';
    interimTranscript = '';

    recognitionRef.value = null;

    if (orderAnswer.value.action == 'payment') {
      console.log('결제 요청 했니?');
      setOrder({ prompt: '', order: [] }).then((res) => {
        console.log('결제 결과:', res);
        orderArr.value = [];
      });
    }
  });
};

const answerOrder = () => {
  console.log(orderAnswer.value.order);
  addToCart(orderAnswer.value.order);
};
</script>

<template>
  <StartPopup @reStartVoiceRecognition="startRecognition" />
  <div class="w-full max-w-screen-xl mx-auto bg-white min-h-screen text-gray-800">
    <!-- Header Banner -->
    <div class="">
      <div class="w-full h-42 overflow-hidden text-center">
        <img class="h-full object-cover object-bottom" src="/event.png" alt="" />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 p-4">
      <!-- Left category tabs -->
      <aside class="col-span-1 flex flex-col gap-4">
        <div
          v-for="tab in categories"
          :key="tab"
          @click="category = tab"
          :class="[
            'flex items-center px-4 py-3 rounded-lg cursor-pointer transition border border-gray-200',
            category === tab ? 'bg-yellow-500 text-white font-bold' : 'bg-gray-50 hover:bg-yellow-100',
          ]"
        >
          <span>{{ categoryLabels[tab] }}</span>
        </div>
      </aside>

      <!-- Menu grid -->
      <main class="col-span-2">
        <h1 class="text-2xl font-extrabold text-gray-800 mb-4">SPECIALS</h1>
        <div class="grid grid-cols-2 gap-6">
          <div
            v-for="item in menu.filter((i) => i.category === category)"
            :key="item.name"
            class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center"
          >
            <img :src="baseUrl + '/' + item.photo" :alt="item.name" class="mb-2 w-24 object-cover" />
            <h2 class="text-base font-semibold">{{ item.name }}</h2>
            <p class="text-sm text-gray-500 mb-1">₩{{ item.price.toLocaleString() }}</p>
            <button @click.stop="addToCart(item)" class="bg-green-600 text-white text-sm px-4 py-1 rounded-full hover:bg-green-700 mt-1">선택</button>
          </div>
        </div>
      </main>
    </div>

    <!-- Bottom wide control area -->
    <div class="fixed bottom-30 left-0 w-full bg-white border-t border-gray-300 shadow-inner z-50 px-10 py-6">
      <div class="max-w-screen-xl mx-auto flex flex-col">
        <!-- Top: Order summary text -->
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-base font-semibold">총주문내역</h2>
          <span class="text-lg font-bold"> {{ cart.reduce((sum, item) => sum + item.quantity, 0) }}개 / {{ totalPrice.toLocaleString() }}원</span>
        </div>

        <!-- Middle: Order item list -->
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-30 overflow-y-auto mb-4">
          <ul class="space-y-2 text-base">
            <li v-for="item in cart" :key="item.name" class="flex justify-between">
              <span>{{ item.name }} x {{ item.quantity }}</span>
              <span>₩{{ (item.price * item.quantity).toLocaleString() }}</span>
            </li>
          </ul>
        </div>

        <!-- Bottom: Control buttons -->
        <div class="flex justify-between items-center">
          <div class="flex gap-6">
            <button class="text-gray-600 text-sm hover:underline">처음으로</button>
            <button class="text-gray-600 text-sm hover:underline">직원호출</button>
          </div>
          <div class="flex gap-4">
            <button class="bg-gray-200 text-gray-800 px-10 py-3 rounded-lg text-base font-semibold hover:bg-gray-300" @click="clearCart">취소하기</button>
            <button class="bg-pink-500 text-white px-10 py-3 rounded-lg text-base font-semibold hover:bg-pink-600">결제하기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 음성 -->
    <div class="fixed bottom-0 left-0 w-full h-30 bg-white border-t border-gray-300 shadow-inner z-50 px-10 py-6">
      <div class="bg-white max-w-screen-xl m-0 mx-auto text-center flex flex-col justify-center items-center gap-4">
        <div
          :class="{ 'grid-cols-[32px_auto_32px]': recognizedText, 'grid-cols-[auto_42px] ': recognizedText.length == 0 }"
          class="w-full grid gap-2 items-center p-2 rounded-xl border-gray-100 border-2 shadow-sm"
        >
          <button v-if="recognizedText" class="w-8 h-8 leading-0 bg-gray-200 p-1.5 rounded-full" @click="clearRecognizedText">
            <svg xmlns="http://www.w3.org/2000/svg" fill="#000000" viewBox="0 0 256 256" id="Flat">
              <path
                stroke="black"
                stroke-width="20"
                d="M202.82861,197.17188a3.99991,3.99991,0,1,1-5.65722,5.65624L128,133.65723,58.82861,202.82812a3.99991,3.99991,0,0,1-5.65722-5.65624L122.343,128,53.17139,58.82812a3.99991,3.99991,0,0,1,5.65722-5.65624L128,122.34277l69.17139-69.17089a3.99991,3.99991,0,0,1,5.65722,5.65624L133.657,128Z"
              />
            </svg>
          </button>
          <div v-if="recognizedText">
            <div v-if="isLoading" class="flex items-center justify-center">
              <div class="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin [animation-duration:2s]"></div>
            </div>
            <p v-else>{{ recognizedText }}</p>
          </div>
          <p v-else class="text-gray-400">음성을 인식해주세요.</p>

          <button v-if="recognizedText" @click="sendVoiceOrder" class="w-8 h-8 leading-0 bg-gray-200 p-1.5 rounded-full">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10.5L7.5 16L18 5.5" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button v-else-if="!isSpeeck" @click="startRecognition" class="rounded-xl bg-green-700 text-white p-3 block m-0 mx-auto">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="마이크 아이콘"
              class="h-[18px] w-[18px]"
              font-size="inherit"
            >
              <path
                d="M18.9953 11.5415C19.5246 11.6991 19.826 12.2559 19.6685 12.7852C18.7771 15.7804 16.179 18.0417 13 18.4381V19.5H14.5C15.0523 19.5 15.5 19.9477 15.5 20.5C15.5 21.0523 15.0523 21.5 14.5 21.5H9.50002C8.94773 21.5 8.50002 21.0523 8.50002 20.5C8.50002 19.9477 8.94773 19.5 9.50002 19.5H11V18.4381C7.82093 18.0418 5.22279 15.7805 4.33136 12.7852C4.17382 12.2559 4.47522 11.6991 5.00456 11.5415C5.5339 11.384 6.09073 11.6854 6.24827 12.2148C6.98609 14.6939 9.28339 16.5 11.9999 16.5C14.7165 16.5 17.0138 14.6939 17.7516 12.2148C17.9091 11.6854 18.466 11.384 18.9953 11.5415Z"
                fill="currentColor"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M14.5 10.5V7C14.5 5.61929 13.3807 4.5 12 4.5C10.6193 4.5 9.5 5.61929 9.5 7V10.5C9.5 11.8807 10.6193 13 12 13C13.3807 13 14.5 11.8807 14.5 10.5ZM12 2.5C9.51472 2.5 7.5 4.51472 7.5 7V10.5C7.5 12.9853 9.51472 15 12 15C14.4853 15 16.5 12.9853 16.5 10.5V7C16.5 4.51472 14.4853 2.5 12 2.5Z"
                fill="currentColor"
              ></path>
            </svg>
          </button>
          <button v-else-if="isSpeeck" @click="stopRecognition" class="rounded-xl bg-green-700 text-white p-2 block m-0 mx-auto">
            <svg width="24" height="24" viewBox="4 4 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-lg">
              <rect x="7" y="7" width="10" height="10" rx="1.25" fill="currentColor"></rect>
            </svg>
          </button>
        </div>

        <p v-if="permissionDenied">음성 인식을 위해 마이크 권한을 허용해주세요.</p>
        <p v-if="permissionRequested">마이크 권한을 요청했어요. 권한을 허용해주세요.</p>
      </div>
    </div>
  </div>

  <ResPopup v-if="orderAnswer" :message="orderAnswer" v-model:visible="popupVisible" @restartSpeeking="startRecognition" @calculateCart="answerOrder" />
</template>

<style scoped>
button {
  transition: background-color 0.2s;
}
</style>
