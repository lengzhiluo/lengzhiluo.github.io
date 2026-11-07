let count = 0;
const btn = document.getElementById("btn");
btn.addEventListener("click", () => {
  count++;
  btn.textContent = `点击次数：${count}`;
});
