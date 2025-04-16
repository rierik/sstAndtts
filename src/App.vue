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
</script>

<template>
  <div>
    <h1>음성 인식</h1>
    <button v-if="!isSpeeck" @click="startRecognition">음성 인식 시작</button>
    <button v-else-if="isSpeeck && recognizedText.length" @click="stopRecognition">음성 인식 멈춤</button>

    v-if="recognizedText"
    <div><button>x</button>테스트테스트{{ recognizedText }}<button>보내기</button></div>
    v-else
    <p>음성을 인식해주세요.</p>
    <p v-if="permissionDenied">음성 인식을 위해 마이크 권한을 허용해주세요.</p>
    <p v-if="permissionRequested">마이크 권한을 요청했어요. 권한을 허용해주세요.</p>
  </div>
</template>

<style scoped>
button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

p {
  font-size: 18px;
  margin-top: 20px;
}
</style>
