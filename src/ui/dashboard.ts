import { buildScenes } from "../scenes";
import {
  loadAuthState,
  loadLibrary,
  updateCurrentUserProfile,
} from "../state";
import type { Project, UserAccount } from "../types";

export interface DashboardActions {
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onUserUpdated: (user: UserAccount) => void;
}

export interface DashboardController {
  refresh: () => void;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatUpdatedAt(timestamp: number): string {
  if (!Number.isFinite(timestamp)) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function createProjectCard(
  project: Project,
  onOpenProject: (projectId: string) => void,
): HTMLButtonElement {
  const card = createElement("button", "dashboard-project");
  card.type = "button";
  card.setAttribute(
    "aria-label",
    `Abrir ${project.title.trim() || "Música sem título"}`,
  );
  const name = createElement(
    "span",
    "dashboard-project-name",
    project.title.trim() || "Música sem título",
  );
  const details = createElement("span", "dashboard-project-details");
  const sceneCount = buildScenes(project).length;
  const sceneLabel = `${sceneCount} ${sceneCount === 1 ? "cena" : "cenas"}`;
  details.append(
    createElement("span", undefined, sceneLabel),
    createElement(
      "span",
      undefined,
      `Alterada em ${formatUpdatedAt(project.updatedAt)}`,
    ),
  );
  card.append(name, details);
  card.addEventListener("click", () => onOpenProject(project.id));
  return card;
}

function labeledInput(
  form: HTMLFormElement,
  id: string,
  labelText: string,
  type: string,
  autocomplete: AutoFill,
): HTMLInputElement {
  const field = createElement("div", "dashboard-profile-field");
  const label = createElement("label", undefined, labelText);
  const input = createElement("input", "dashboard-profile-input");
  input.id = id;
  input.name = id;
  input.type = type;
  input.autocomplete = autocomplete;
  label.htmlFor = id;
  field.append(label, input);
  form.append(field);
  return input;
}

export function mountDashboard(
  root: HTMLElement,
  actions: DashboardActions,
): DashboardController {
  const status = root.querySelector<HTMLElement>("#dashboardStatus");
  const content = createElement("section", "dashboard-content");
  const welcome = createElement("section", "dashboard-welcome");
  const welcomeName = createElement("h1", "dashboard-welcome-name");
  const welcomeChurch = createElement("p", "dashboard-welcome-church");
  welcome.append(welcomeName, welcomeChurch);

  const navigation = createElement("div", "dashboard-navigation");
  const tabList = createElement("nav", "dashboard-tabs");
  tabList.setAttribute("aria-label", "Área da conta");
  tabList.setAttribute("role", "tablist");
  const songsTab = createElement("button", "dashboard-tab", "Músicas");
  const profileTab = createElement(
    "button",
    "dashboard-tab",
    "Meus dados / Cadastro",
  );
  for (const [tab, panelId] of [
    [songsTab, "dashboardSongsPanel"],
    [profileTab, "dashboardProfilePanel"],
  ] as const) {
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panelId);
  }
  const newProjectButton = createElement(
    "button",
    "dashboard-new-project",
    "+ Nova música",
  );
  newProjectButton.type = "button";
  newProjectButton.addEventListener("click", actions.onCreateProject);
  tabList.append(songsTab, profileTab);
  navigation.append(tabList, newProjectButton);

  const projectList = createElement("div", "dashboard-project-list");
  projectList.id = "dashboardSongsPanel";
  projectList.setAttribute("role", "tabpanel");
  projectList.setAttribute("aria-label", "Músicas salvas");

  const profilePanel = createElement("section", "dashboard-profile");
  profilePanel.id = "dashboardProfilePanel";
  profilePanel.setAttribute("role", "tabpanel");
  profilePanel.setAttribute("aria-label", "Dados do cadastro");
  const profileForm = createElement("form", "dashboard-profile-form");
  profileForm.noValidate = true;
  const nameInput = labeledInput(
    profileForm,
    "profileName",
    "Nome",
    "text",
    "name",
  );
  const churchInput = labeledInput(
    profileForm,
    "profileChurch",
    "Igreja",
    "text",
    "organization",
  );
  const emailInput = labeledInput(
    profileForm,
    "profileEmail",
    "E-mail",
    "email",
    "email",
  );
  nameInput.maxLength = 80;
  churchInput.maxLength = 120;
  emailInput.maxLength = 254;
  const passwordInput = labeledInput(
    profileForm,
    "profilePassword",
    "Nova senha (opcional)",
    "password",
    "new-password",
  );
  passwordInput.minLength = 6;
  passwordInput.setAttribute(
    "aria-describedby",
    "dashboardPasswordHint",
  );
  const passwordHint = createElement(
    "p",
    "dashboard-profile-hint",
    "Deixe em branco para manter a senha atual.",
  );
  passwordHint.id = "dashboardPasswordHint";
  const saveProfileButton = createElement(
    "button",
    "dashboard-profile-save",
    "Salvar cadastro",
  );
  saveProfileButton.type = "submit";
  profileForm.append(passwordHint, saveProfileButton);
  profilePanel.append(profileForm);

  content.append(welcome, navigation, projectList, profilePanel);
  root.replaceChildren(
    ...(status ? [status, content] : [content]),
  );

  let activeTab: "songs" | "profile" = "songs";
  let currentUser: UserAccount | null = null;

  function showTab(tab: "songs" | "profile"): void {
    activeTab = tab;
    const showSongs = tab === "songs";
    songsTab.setAttribute("aria-selected", String(showSongs));
    profileTab.setAttribute("aria-selected", String(!showSongs));
    songsTab.tabIndex = showSongs ? 0 : -1;
    profileTab.tabIndex = showSongs ? -1 : 0;
    projectList.hidden = !showSongs;
    profilePanel.hidden = showSongs;
    newProjectButton.hidden = !showSongs;
    if (status) status.textContent = "";
  }
  songsTab.addEventListener("click", () => showTab("songs"));
  profileTab.addEventListener("click", () => showTab("profile"));

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentUser) return;
    if (status) status.textContent = "";
    saveProfileButton.disabled = true;
    void updateCurrentUserProfile({
      name: nameInput.value,
      church: churchInput.value,
      email: emailInput.value,
      ...(passwordInput.value ? { password: passwordInput.value } : {}),
    })
      .then((user) => {
        passwordInput.value = "";
        actions.onUserUpdated(user);
        refresh();
        if (status) status.textContent = "Dados do cadastro atualizados.";
      })
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar o cadastro.";
        }
      })
      .finally(() => {
        saveProfileButton.disabled = false;
      });
  });

  function renderProfile(user: UserAccount): void {
    welcomeName.textContent = user.name || "Meu painel";
    welcomeChurch.textContent =
      user.church || "Adicione o nome da sua igreja nos seus dados.";
    nameInput.value = user.name;
    churchInput.value = user.church;
    emailInput.value = user.email;
    passwordInput.hidden = user.provider !== "email";
    passwordInput.parentElement?.toggleAttribute(
      "hidden",
      user.provider !== "email",
    );
    passwordHint.hidden = user.provider !== "email";
  }

  function refresh(): void {
    currentUser = loadAuthState().currentUser;
    if (currentUser) renderProfile(currentUser);
    const library = loadLibrary();
    projectList.replaceChildren();
    if (library.projects.length === 0) {
      projectList.append(
        createElement(
          "p",
          "dashboard-empty",
          "Ainda não há músicas. Crie uma música para começar.",
        ),
      );
    } else {
      for (const project of [...library.projects].sort(
        (first, second) => second.updatedAt - first.updatedAt,
      )) {
        projectList.append(createProjectCard(project, actions.onOpenProject));
      }
    }
    showTab(activeTab);
  }

  refresh();
  return { refresh };
}
