import { buildScenes } from "../scenes";
import { loadLibrary, saveUserName } from "../state";
import type { Project } from "../types";

export interface DashboardActions {
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
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

export function mountDashboard(
  root: HTMLElement,
  actions: DashboardActions,
): DashboardController {
  const header = createElement("header", "dashboard-header");
  const brand = createElement("a", "dashboard-brand");
  brand.href = "#";
  brand.setAttribute("aria-label", "LyricMotion");
  brand.append(
    document.createTextNode("LyricMotion"),
    createElement("span", undefined, "."),
  );

  const userNameHost = createElement("div", "dashboard-user");
  const status = root.querySelector<HTMLElement>("#dashboardStatus");
  const content = createElement("section", "dashboard-content");
  const navigation = createElement("div", "dashboard-navigation");
  const tabList = createElement("nav", "dashboard-tabs");
  tabList.setAttribute("aria-label", "Biblioteca");
  const tab = createElement("button", "dashboard-tab", "Músicas");
  tab.type = "button";
  tab.setAttribute("aria-current", "page");
  tabList.append(tab);

  const newProjectButton = createElement(
    "button",
    "dashboard-new-project",
    "+ Nova música",
  );
  newProjectButton.type = "button";
  newProjectButton.addEventListener("click", actions.onCreateProject);
  navigation.append(tabList, newProjectButton);

  const projectList = createElement("div", "dashboard-project-list");
  projectList.setAttribute("aria-label", "Músicas salvas");
  content.append(navigation, projectList);
  header.append(brand, userNameHost);
  root.replaceChildren(...(status ? [status, header, content] : [header, content]));

  function renderUserName(userName: string): void {
    const editButton = createElement(
      "button",
      "dashboard-user-name",
      userName || "Equipe de Mídia",
    );
    editButton.type = "button";
    editButton.setAttribute("aria-label", "Editar nome do usuário");
    editButton.addEventListener("click", () => {
      const form = createElement("form", "dashboard-user-form");
      const input = createElement("input", "dashboard-user-input");
      input.type = "text";
      input.maxLength = 80;
      input.value = userName;
      input.setAttribute("aria-label", "Nome do usuário");
      const saveButton = createElement(
        "button",
        "dashboard-user-save",
        "Salvar",
      );
      saveButton.type = "submit";
      form.append(input, saveButton);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const nextName = input.value.trim() || "Equipe de Mídia";
        try {
          saveUserName(nextName);
          if (status) status.textContent = "";
          refresh();
        } catch {
          if (status) {
            status.textContent =
              "Não foi possível salvar o nome neste navegador.";
          }
        }
      });
      userNameHost.replaceChildren(form);
      input.focus();
      input.select();
    });
    userNameHost.replaceChildren(editButton);
  }

  function refresh(): void {
    const library = loadLibrary();
    renderUserName(library.userName);
    projectList.replaceChildren();
    if (library.projects.length === 0) {
      projectList.append(
        createElement(
          "p",
          "dashboard-empty",
          "Ainda não há músicas. Crie uma música para começar.",
        ),
      );
      return;
    }
    for (const project of [...library.projects].sort(
      (first, second) => second.updatedAt - first.updatedAt,
    )) {
      projectList.append(createProjectCard(project, actions.onOpenProject));
    }
  }

  refresh();
  return { refresh };
}
