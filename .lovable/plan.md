

## A funcionalidade vai pesar o app?

**Resposta curta: Não.** O impacto no app é mínimo. Veja por quê:

### O que acontece no app (client-side)
- A única coisa extra é converter a foto para base64 e enviar para a backend function — isso já acontece de forma similar no upload atual
- A imagem já é comprimida antes do envio (máx 1200px, ~80KB) graças ao `compressImage` que já existe no app
- Nenhuma biblioteca nova precisa ser instalada
- O botão "✨ Identificar" só é chamado quando o usuário clica — não roda automaticamente

### O que acontece no servidor (edge function)
- Todo o processamento pesado (IA) roda no servidor, não no celular do usuário
- A edge function envia a imagem para o Lovable AI Gateway e retorna um JSON pequeno (~200 bytes)
- Tempo estimado: 2-4 segundos de espera (com loading spinner)

### Resumo do impacto

| Aspecto | Impacto |
|---------|---------|
| Tamanho do app (bundle) | Zero — nenhuma lib nova |
| Memória/CPU do celular | Mínimo — só converte base64 |
| Tráfego de rede | ~80-150KB por identificação (imagem comprimida) |
| Tempo de resposta | 2-4s (com feedback visual de loading) |

A arquitetura é leve por design: o app só envia a foto e recebe texto de volta. Toda a "inteligência" roda na nuvem.

Quer que eu implemente?

