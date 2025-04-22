<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showPopup = ref(true);
const audioRef = ref(null);

const handleStart = () => {
  audioRef.value?.play();
};

const onAudioEnded = () => {
  showPopup.value = false;
};

onMounted(() => {
  audioRef.value?.addEventListener('ended', onAudioEnded);
});

onUnmounted(() => {
  audioRef.value?.removeEventListener('ended', onAudioEnded);
});
</script>

<template>
  <div v-if="showPopup" class="fixed inset-0 bg-black/50 flex items-center justify-center z-999 w-full h-screen">
    <div class="bg-white rounded-2xl shadow-lg p-8 w-80 text-center">
      <h2 class="text-2xl font-bold mb-4">🍔 햄버거 키오스크</h2>
      <p class="mb-6 text-gray-700">시작하려면 버튼을 눌러주세요</p>
      <button @click="handleStart" class="bg-yellow-500 text-white text-lg font-semibold px-6 py-2 rounded-xl hover:bg-yellow-600 transition">시작하기</button>
    </div>
  </div>
  <audio ref="audioRef" src="/welcome.wav" preload="auto" />
</template>
