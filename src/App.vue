<script setup>
import { ref } from 'vue';

const isSpeeck = ref(false);
const recognizedText = ref('');
const permissionDenied = ref(false);
const permissionRequested = ref(false);
const recognitionRef = ref(null); // recognition 인스턴스를 저장할 ref

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
  recognitionRef.value = recognition; // 외부에서 접근 가능하게 저장
  recognition.lang = 'ko-KR';
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    recognizedText.value = transcript;
    console.log('인식된 텍스트:', transcript);
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service not allowed') {
      permissionDenied.value = true;
      console.log('마이크 권한이 거부되었습니다.');
    }
  };

  recognition.start();
  console.log('음성 인식 시작됨...');
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
        .getUserMedia({ audio: true })
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
};
</script>

<template>
  <div class="m-0 mx-auto text-center flex flex-col justify-center items-center gap-4 h-screen p-4">
    <h1 class="text-2xl font-bold">음성 인식</h1>
    <button class="rounded-xl bg-green-700 text-white p-3 block m-0 mx-auto" v-if="!isSpeeck" @click="startRecognition">음성 인식 시작</button>
    <button v-else-if="isSpeeck && recognizedText.length" @click="stopRecognition">음성 인식 멈춤</button>

    <div :class="{ recognizedText: `grid-cols-[32px_auto_32px]` }" class="w-full grid gap-2 items-center p-2 rounded-xl border-gray-100 border-2 shadow-sm">
      <button v-if="recognizedText" class="w-8 h-8 leading-0 bg-gray-200 p-1.5 rounded-full" @click="clearRecognizedText">
        <svg xmlns="http://www.w3.org/2000/svg" fill="#000000" viewBox="0 0 256 256" id="Flat">
          <path
            stroke="black"
            stroke-width="20"
            d="M202.82861,197.17188a3.99991,3.99991,0,1,1-5.65722,5.65624L128,133.65723,58.82861,202.82812a3.99991,3.99991,0,0,1-5.65722-5.65624L122.343,128,53.17139,58.82812a3.99991,3.99991,0,0,1,5.65722-5.65624L128,122.34277l69.17139-69.17089a3.99991,3.99991,0,0,1,5.65722,5.65624L133.657,128Z"
          />
        </svg>
      </button>
      <p v-if="recognizedText">{{ recognizedText }}</p>
      <p v-else class="text-gray-400">음성을 인식해주세요.</p>
      <button v-if="recognizedText" class="w-8 h-8 leading-0 bg-gray-200 p-1.5 rounded-full">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 10.5L7.5 16L18 5.5" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <p v-if="permissionDenied">음성 인식을 위해 마이크 권한을 허용해주세요.</p>
    <p v-if="permissionRequested">마이크 권한을 요청했어요. 권한을 허용해주세요.</p>
  </div>
</template>

<style scoped></style>
