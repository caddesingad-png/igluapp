import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";

const LegalShell = ({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
        <Link to="/" className="p-2 -ml-2 rounded-md hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <img
          src={igluLogo}
          alt="IGLU"
          className="h-5"
          style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(8%) saturate(800%) hue-rotate(340deg) brightness(90%) contrast(90%)" }}
        />
      </div>
    </header>
    <main className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-[28px] text-foreground mb-1">{title}</h1>
      <p className="font-body text-[12px] text-muted-foreground uppercase tracking-[0.12em] mb-8">
        Atualizado em {updatedAt}
      </p>
      <div className="font-body text-[14px] text-foreground/90 leading-relaxed [&_h2]:font-display [&_h2]:text-[18px] [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-normal [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1.5 [&_a]:text-foreground [&_a]:underline">
        {children}
      </div>
    </main>
  </div>
);

const Privacy = () => (
  <LegalShell title="Política de Privacidade" updatedAt="17 de junho de 2026">
    <p>
      Sua privacidade é prioridade no IGLU. Esta Política explica quais dados coletamos,
      como usamos e quais são seus direitos, em conformidade com a Lei Geral de Proteção
      de Dados (LGPD — Lei nº 13.709/2018).
    </p>

    <h2>1. Quem somos</h2>
    <p>
      IGLU é controlado pela equipe responsável pelo aplicativo de mesmo nome. Para
      qualquer assunto relacionado a esta Política, escreva para{" "}
      <a href="mailto:privacidade@igluapp.com">privacidade@igluapp.com</a>.
    </p>

    <h2>2. Dados que coletamos</h2>
    <ul>
      <li><strong>Cadastro:</strong> e-mail e senha (criptografada). Opcionalmente, nome de exibição, foto de perfil e bio.</li>
      <li><strong>Conteúdo:</strong> produtos, SETs, fotos, anotações, histórico de compras que você registra.</li>
      <li><strong>Uso:</strong> dados técnicos básicos (tipo de dispositivo, idioma) para garantir o funcionamento do app.</li>
      <li><strong>Login social:</strong> ao entrar com Google ou Apple, recebemos seu e-mail e nome público.</li>
    </ul>

    <h2>3. Como usamos seus dados</h2>
    <ul>
      <li>Operar o serviço (login, salvar sua coleção, exibir seus SETs).</li>
      <li>Personalizar sua experiência (sugestões, histórico, recomendações de revisão).</li>
      <li>Comunicar avisos importantes (confirmação de conta, recuperação de senha).</li>
      <li>Garantir segurança e prevenir fraudes.</li>
    </ul>
    <p>Não vendemos seus dados. Não usamos seus dados para publicidade de terceiros.</p>

    <h2>4. Compartilhamento</h2>
    <ul>
      <li><strong>Provedores de infraestrutura:</strong> Supabase (banco de dados, autenticação), Lovable (hospedagem).</li>
      <li><strong>IA:</strong> ao usar identificação automática por foto ou revisão inteligente, a imagem/descrição é enviada ao Google Gemini exclusivamente para gerar a resposta.</li>
      <li><strong>Conteúdo público:</strong> SETs que você marca como públicos ficam visíveis para outras pessoas usuárias.</li>
    </ul>

    <h2>5. Cookies e armazenamento local</h2>
    <p>
      Usamos armazenamento local (localStorage) apenas para manter sua sessão ativa. Não
      utilizamos cookies de rastreamento publicitário.
    </p>

    <h2>6. Seus direitos (LGPD)</h2>
    <p>Você pode, a qualquer momento:</p>
    <ul>
      <li>Acessar e corrigir seus dados pelo perfil.</li>
      <li>Exportar seus dados (mediante solicitação por e-mail).</li>
      <li><strong>Excluir sua conta</strong> e todos os dados associados, pelo menu de Configurações.</li>
      <li>Revogar consentimentos e contestar tratamentos.</li>
    </ul>

    <h2>7. Retenção</h2>
    <p>
      Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta, todos os
      dados pessoais e conteúdos são removidos definitivamente em até 30 dias, exceto quando
      a retenção for exigida por obrigação legal.
    </p>

    <h2>8. Segurança</h2>
    <ul>
      <li>Senhas armazenadas com hash forte; nunca acessamos a senha em texto puro.</li>
      <li>Bloqueio de senhas conhecidas em vazamentos públicos (HIBP).</li>
      <li>Conexões criptografadas (HTTPS) em todas as comunicações.</li>
      <li>Controles de acesso por linha (RLS) — você só vê seus próprios dados privados.</li>
    </ul>

    <h2>9. Crianças e adolescentes</h2>
    <p>
      O IGLU não é destinado a menores de 13 anos. Caso identifiquemos cadastro de menor
      sem consentimento dos responsáveis, a conta será excluída.
    </p>

    <h2>10. Alterações</h2>
    <p>
      Esta Política pode ser atualizada. Mudanças significativas serão avisadas no app ou
      por e-mail antes de entrarem em vigor.
    </p>

    <h2>11. Encarregada(o) pelo tratamento de dados (DPO)</h2>
    <p>
      Para dúvidas, exercício de direitos ou solicitações relacionadas à LGPD, contate{" "}
      <a href="mailto:privacidade@igluapp.com">privacidade@igluapp.com</a>.
    </p>
  </LegalShell>
);

export default Privacy;
