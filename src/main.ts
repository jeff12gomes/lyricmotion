import "./ui/styles.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Elemento principal #app não encontrado.");
}

app.textContent = "LyricMotion — em construção";
