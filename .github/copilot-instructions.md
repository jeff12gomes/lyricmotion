Este repositório é o LyricMotion: app web que transforma letras de música em vídeos animados para o telão da igreja.
- TypeScript + Vite, sem framework na interface. Site estático publicado no GitHub Pages.
- Siga a estrutura de pastas em src/ (render, audio, sync, export, live, ui).
- Existe uma única função de desenho: render(ctx, tempo, projeto). Prévia, modo ao vivo e exportação usam essa função. Não duplique lógica de desenho.
- O arquivo referencia/prototipo_lyricmotion.html é a referência de comportamento.
- Textos da interface em português do Brasil. Nomes de código em inglês.
- Nunca inserir texto do usuário como HTML; use textContent.
- Não adicione bibliotecas sem necessidade; explique no PR quando adicionar.
- Toda mudança deve manter npm run build e npm test funcionando e incluir passos de teste manual no PR.
