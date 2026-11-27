import {
  loadAuthState,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
} from "../state";
import type { UserAccount } from "../types";

export interface HomeActions {
  onAuthenticated: () => void;
  onGoToDashboard: () => void;
  onLogout: () => void;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function labeledInput(
  form: HTMLFormElement,
  labelText: string,
  name: string,
  type: string,
  autocomplete: AutoFill,
  required = true,
): HTMLInputElement {
  const wrapper = element("div", "auth-field");
  const label = element("label", undefined, labelText);
  const input = element("input", "auth-input");
  input.id = `auth-${name}`;
  input.name = name;
  input.type = type;
  input.autocomplete = autocomplete;
  input.required = required;
  if (type === "password") input.minLength = 6;
  label.htmlFor = input.id;
  wrapper.append(label, input);
  form.append(wrapper);
  return input;
}

function publicGoogleAccounts(): UserAccount[] {
  return loadAuthState().users.filter(({ provider }) => provider === "google");
}

export function mountHome(root: HTMLElement, actions: HomeActions): void {
  const layout = element("div", "home-layout");
  const presentation = element("section", "home-presentation");
  const homeStatus = element("p", "home-session-status");
  homeStatus.id = "homeStatus";
  homeStatus.setAttribute("role", "status");
  homeStatus.setAttribute("aria-live", "polite");
  const brandRow = element("div", "home-brand-row");
  const brand = element("a", "home-brand", "LyricMotion.");
  brand.href = "#home";
  brand.setAttribute("aria-label", "LyricMotion");
  brandRow.append(brand);
  const currentUser = loadAuthState().currentUser;
  if (currentUser) {
    const sessionActions = element("div", "home-session-actions");
    const dashboardButton = element(
      "button",
      "home-session-button home-session-primary",
      "Ir para meu painel",
    );
    dashboardButton.type = "button";
    dashboardButton.addEventListener("click", actions.onGoToDashboard);
    const logoutButton = element(
      "button",
      "home-session-button",
      "Sair",
    );
    logoutButton.type = "button";
    logoutButton.addEventListener("click", actions.onLogout);
    sessionActions.append(dashboardButton, logoutButton);
    brandRow.append(sessionActions);
  }
  const eyebrow = element("p", "home-eyebrow", "PARA EQUIPES DE MÍDIA");
  const headline = element("h1", "home-headline", "Da letra ao telão em minutos");
  const intro = element(
    "p",
    "home-intro",
    "Transforme letras de música em vídeos animados para o culto, com uma prévia simples e controle visual em cada cena.",
  );
  const features = element("ul", "home-features");
  const featureItems = [
    ["01", "Cenas separadas por estrofe"],
    ["02", "Temas animados de louvor"],
    ["03", "Exportação individual ou em .zip"],
  ];
  for (const [number, label] of featureItems) {
    const item = element("li", "home-feature");
    item.append(
      element("span", "home-feature-number", number),
      element("span", "home-feature-label", label),
    );
    features.append(item);
  }
  const rightsNotice = element(
    "p",
    "home-rights-notice",
    "Respeite os direitos autorais: cole suas próprias letras. O LyricMotion não fornece letras de músicas.",
  );
  presentation.append(
    homeStatus,
    brandRow,
    eyebrow,
    headline,
    intro,
    features,
    rightsNotice,
  );

  const accessCard = element("section", "auth-card");
  accessCard.setAttribute("aria-label", "Acesso ao LyricMotion");
  const accessHeading = element("h2", "auth-heading", "Acesse sua equipe");
  const accessIntro = element(
    "p",
    "auth-subheading",
    "Entre ou crie uma conta para organizar suas músicas.",
  );
  const continueButton = element(
    "button",
    "auth-submit auth-continue-button",
    currentUser ? `Continuar como ${currentUser.name}` : "Continuar",
  );
  continueButton.type = "button";
  continueButton.hidden = !currentUser;
  continueButton.addEventListener("click", actions.onGoToDashboard);
  const tabs = element("div", "auth-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Tipo de acesso");
  const signInTab = element("button", "auth-tab", "Entrar");
  const signUpTab = element("button", "auth-tab", "Cadastrar");
  signInTab.type = "button";
  signUpTab.type = "button";
  signInTab.setAttribute("role", "tab");
  signUpTab.setAttribute("role", "tab");
  const status = element("p", "auth-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const signInForm = element("form", "auth-form");
  signInForm.noValidate = true;
  const signInEmail = labeledInput(
    signInForm,
    "E-mail",
    "email",
    "email",
    "email",
  );
  const signInPassword = labeledInput(
    signInForm,
    "Senha",
    "password",
    "password",
    "current-password",
  );
  const signInSubmit = element("button", "auth-submit", "Entrar");
  signInSubmit.type = "submit";
  const demoHint = element(
    "p",
    "auth-demo-hint",
    "Acesso de demonstração: teste@lyricmotion.com · 123456",
  );
  signInForm.append(signInSubmit, demoHint);

  const signUpForm = element("form", "auth-form");
  signUpForm.noValidate = true;
  const fullName = labeledInput(
    signUpForm,
    "Nome completo",
    "name",
    "text",
    "name",
  );
  labeledInput(
    signUpForm,
    "Nome da igreja (opcional)",
    "church",
    "text",
    "organization",
    false,
  );
  const signUpEmail = labeledInput(
    signUpForm,
    "E-mail",
    "email",
    "email",
    "email",
  );
  const signUpPassword = labeledInput(
    signUpForm,
    "Senha",
    "password",
    "password",
    "new-password",
  );
  const signUpSubmit = element("button", "auth-submit", "Criar conta");
  signUpSubmit.type = "submit";
  signUpForm.append(signUpSubmit);

  const divider = element("div", "auth-divider", "ou");
  const googleButton = element("button", "auth-google-button");
  googleButton.type = "button";
  const googleIcon = element("span", "google-icon", "G");
  googleIcon.setAttribute("aria-hidden", "true");
  const googleLabel = element("span", "auth-google-label", "Entrar com Google");
  googleButton.append(googleIcon, googleLabel);
  accessCard.append(
    accessHeading,
    accessIntro,
    continueButton,
    tabs,
    status,
    signInForm,
    signUpForm,
    divider,
    googleButton,
  );
  tabs.append(signInTab, signUpTab);
  layout.append(presentation, accessCard);
  root.replaceChildren(layout);

  let activeTab: "signin" | "signup" = "signin";
  const setStatus = (message: string, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };
  const setBusy = (busy: boolean) => {
    signInSubmit.disabled = busy;
    signUpSubmit.disabled = busy;
    googleButton.disabled = busy;
  };
  const setTab = (nextTab: "signin" | "signup") => {
    activeTab = nextTab;
    const signInActive = nextTab === "signin";
    signInTab.setAttribute("aria-selected", String(signInActive));
    signUpTab.setAttribute("aria-selected", String(!signInActive));
    signInTab.tabIndex = signInActive ? 0 : -1;
    signUpTab.tabIndex = signInActive ? -1 : 0;
    signInForm.hidden = !signInActive;
    signUpForm.hidden = signInActive;
    googleLabel.textContent = signInActive
      ? "Entrar com Google"
      : "Cadastrar com Google";
    setStatus("");
  };
  signInTab.addEventListener("click", () => setTab("signin"));
  signUpTab.addEventListener("click", () => setTab("signup"));

  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    void loginWithEmail(signInEmail.value, signInPassword.value)
      .then(actions.onAuthenticated)
      .catch((error: unknown) => {
        setStatus(
          error instanceof Error ? error.message : "Não foi possível entrar.",
          true,
        );
      })
      .finally(() => setBusy(false));
  });
  signUpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    const church =
      signUpForm.elements.namedItem("church") instanceof HTMLInputElement
        ? signUpForm.elements.namedItem("church") as HTMLInputElement
        : null;
    void registerWithEmail(
      fullName.value,
      church?.value ?? "",
      signUpEmail.value,
      signUpPassword.value,
    )
      .then(actions.onAuthenticated)
      .catch((error: unknown) => {
        setStatus(
          error instanceof Error
            ? error.message
            : "Não foi possível criar a conta.",
          true,
        );
      })
      .finally(() => setBusy(false));
  });

  function openGoogleDialog(): void {
    const dialog = element("dialog", "google-dialog");
    const form = element("form", "google-dialog-form");
    form.method = "dialog";
    const title = element("h2", undefined, "Continuar com Google");
    const description = element(
      "p",
      "google-dialog-description",
      "Simulação local: escolha uma conta Google salva ou informe seus dados.",
    );
    const existingAccounts = publicGoogleAccounts();
    const selectLabel = element("label", undefined, "Contas usadas neste navegador");
    selectLabel.htmlFor = "googleAccountSelect";
    const select = element("select", "auth-input");
    select.id = "googleAccountSelect";
    const blankOption = element("option", undefined, "Escolha uma conta");
    blankOption.value = "";
    select.append(blankOption);
    for (const account of existingAccounts) {
      const option = element(
        "option",
        undefined,
        `${account.name} (${account.email})`,
      );
      option.value = account.id;
      select.append(option);
    }
    form.append(title, description, selectLabel, select);
    const nameInput = labeledInput(form, "Nome", "googleName", "text", "name");
    const emailInput = labeledInput(
      form,
      "E-mail Google",
      "googleEmail",
      "email",
      "email",
    );
    select.addEventListener("change", () => {
      const selected = existingAccounts.find(({ id }) => id === select.value);
      if (selected) {
        nameInput.value = selected.name;
        emailInput.value = selected.email;
      }
    });
    const dialogStatus = element("p", "auth-status");
    dialogStatus.setAttribute("role", "status");
    const actionsRow = element("div", "google-dialog-actions");
    const cancel = element("button", "auth-cancel", "Cancelar");
    cancel.type = "button";
    cancel.addEventListener("click", () => dialog.close());
    const continueButton = element(
      "button",
      "auth-submit",
      "Continuar",
    );
    continueButton.type = "submit";
    actionsRow.append(cancel, continueButton);
    form.append(
      dialogStatus,
      actionsRow,
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        loginWithGoogle(nameInput.value, emailInput.value);
        dialog.close();
        actions.onAuthenticated();
      } catch (error) {
        dialogStatus.textContent =
          error instanceof Error
            ? error.message
            : "Não foi possível continuar com Google.";
        dialogStatus.classList.add("is-error");
      }
    });
    dialog.append(form);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    root.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  googleButton.addEventListener("click", openGoogleDialog);

  setTab(activeTab);
}
