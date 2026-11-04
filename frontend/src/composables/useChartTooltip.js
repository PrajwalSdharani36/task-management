import { reactive } from 'vue';

export function useChartTooltip() {
  const tip = reactive({ visible: false, x: 0, y: 0, title: '', lines: [] });

  function show(event, title, lines = []) {
    const box = event.currentTarget.closest('.chart')?.getBoundingClientRect();
    if (!box) return;
    tip.x = event.clientX - box.left;
    tip.y = event.clientY - box.top;
    tip.title = title;
    tip.lines = lines;
    tip.visible = true;
  }

  function hide() {
    tip.visible = false;
  }

  return { tip, show, hide };
}
