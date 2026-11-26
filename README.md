# LyricMotion

O LyricMotion é um app web que transforma letras de música em vídeos animados para o telão da igreja. É um site estático, feito com Vite e TypeScript, sem framework de interface, e preparado para publicação no GitHub Pages.

## Rodar localmente

Requer Node.js e npm.

```sh
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. A página inicial exibe “LyricMotion — em construção”.

## Testar e compilar

```sh
npm test
npm run build
```

O build de produção é gerado na pasta `dist/`. Para conferir a versão compilada localmente:

```sh
npm run preview
```

## Publicação

O workflow [Deploy to GitHub Pages](.github/workflows/deploy.yml) publica o site automaticamente a cada push na branch `main` (incluindo merges) e também pode ser iniciado manualmente pela aba **Actions**.

Na primeira publicação, configure o repositório em **Settings > Pages > Build and deployment > Source** para **GitHub Actions**. O workflow instala as dependências, executa `npm test` e `npm run build`; se os testes falharem, o artefato não é enviado e o deploy não acontece.

Após o workflow concluir, o site estará em `https://<seu-usuario>.github.io/lyricmotion/`. O protótipo existente em `referencia/prototipo_lyricmotion.htm` é incluído no site como `https://<seu-usuario>.github.io/lyricmotion/prototipo.html`.
