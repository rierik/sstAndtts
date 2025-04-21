<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 z-50" @click="close"></div>

  <div
    class="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-md space-y-4"
    :class="visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
  >
    <div class="relative space-y-4 p-10">
      <!-- 응답 텍스트 -->
      <p class="font-bold text-xl whitespace-pre-wrap text-gray-800 pb-4">
        {{ message.answer }}
      </p>

      <!-- 주문 목록 -->
      <div v-for="(item, index) in message.order" :key="index" class="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
        <div class="text-sm text-gray-700 font-semibold">{{ item.name }}</div>
        <div class="text-sm text-gray-600">수량: {{ item.quantity }}</div>
        <div class="text-sm text-gray-600">
          가격: <span class="font-bold text-gray-800">{{ item.price.toLocaleString() }}원</span>
        </div>
      </div>

      <!-- 닫기 버튼 -->
      <button @click="close" class="absolute top-5 right-5 text-gray-400 hover:text-gray-600">✕</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: String,
  visible: Boolean,
  restartSpeak: Function,
});

const emit = defineEmits(['update:visible']);

let timer = null;

const close = () => {
  emit('update:visible', false);
  props.restartSpeak();
};
</script>
