import { customRef, onBeforeUnmount } from 'vue';

export function useDebouncedRef(initialValue, delay = 400) {
  let timer;
  let value = initialValue;

  onBeforeUnmount(() => clearTimeout(timer));

  return customRef((track, trigger) => ({
    get() {
      track();
      return value;
    },
    set(newValue) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        value = newValue;
        trigger();
      }, delay);
    },
  }));
}
