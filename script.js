// element variables

const roleSelect = document.getElementById("role");
const otherInput = document.getElementById("other");

// others input field dynamic required
roleSelect.addEventListener("change", () => {
  const isOther = roleSelect.value === "others";
  otherInput.required = isOther;
  if (!isOther) otherInput.value = "";
});
