import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import igluLogo from "@/assets/iglu-logo.svg";

const LegalShell = ({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) => (
  <div className="min-h-dvh bg-background">
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border safe-top">
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
      <div className="prose prose-sm max-w-none font-body text-[14px] text-foreground/90 leading-relaxed [&_h2]:font-display [&_h2]:text-[18px] [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-normal [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1.5 [&_a]:text-foreground [&_a]:underline">
        {children}
      </div>
    </main>
  </div>
);

const Terms = () => (
  <LegalShell title="Termos de Uso" updatedAt="17 de junho de 2026">
    <p>
      Bem-vinda ao IGLU. Estes Termos de Uso ("Termos") regulam o uso do aplicativo IGLU
      ("Aplicativo"), uma ferramenta pessoal para organização de coleções de maquiagem.
      Ao criar uma conta ou utilizar o Aplicativo, você concorda integralmente com estes Termos.
    </p>

    <h2>1. Sobre o serviço</h2>
    <p>
      O IGLU permite que você cadastre produtos da sua coleção, organize SETs, registre
      compras e compartilhe SETs publicamente, se desejar. O serviço é fornecido
      gratuitamente, podendo ter funcionalidades pagas no futuro mediante aviso prévio.
    </p>

    <h2>2. Conta</h2>
    <ul>
      <li>Você deve ter pelo menos 13 anos para criar uma conta.</li>
      <li>É responsável por manter a confidencialidade da sua senha.</li>
      <li>Pode excluir sua conta a qualquer momento pelo menu de Configurações.</li>
    </ul>

    <h2>3. Conteúdo da pessoa usuária</h2>
    <p>
      Todo conteúdo que você adiciona (fotos de produtos, nomes, anotações, SETs) permanece
      de sua propriedade. Ao publicar um SET, você nos concede uma licença não exclusiva,
      mundial e gratuita para exibi-lo dentro do Aplicativo para outras pessoas usuárias.
    </p>

    <h2>4. Conduta</h2>
    <p>Você concorda em não:</p>
    <ul>
      <li>Publicar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros.</li>
      <li>Usar o Aplicativo para fins comerciais não autorizados (revenda de dados, spam, etc.).</li>
      <li>Tentar acessar contas de outras pessoas ou comprometer a segurança do serviço.</li>
    </ul>

    <h2>5. Propriedade intelectual</h2>
    <p>
      O nome IGLU, o logotipo, o design e o código do Aplicativo são protegidos por direitos
      autorais e marca registrada. Você não pode copiá-los ou utilizá-los sem autorização escrita.
    </p>

    <h2>6. Limitação de responsabilidade</h2>
    <p>
      O IGLU é fornecido "como está". Não nos responsabilizamos por perda de dados, decisões
      de compra tomadas com base nas informações do Aplicativo, ou indisponibilidades temporárias
      do serviço, salvo nas hipóteses previstas em lei.
    </p>

    <h2>7. Alterações dos Termos</h2>
    <p>
      Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou
      dentro do Aplicativo. O uso continuado após a atualização configura aceite.
    </p>

    <h2>8. Encerramento</h2>
    <p>
      Podemos suspender ou encerrar sua conta caso identifiquemos violação destes Termos.
      Você também pode excluir sua conta a qualquer momento — todos os seus dados serão
      removidos definitivamente.
    </p>

    <h2>9. Lei aplicável</h2>
    <p>
      Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
      foro do domicílio da pessoa usuária para dirimir qualquer controvérsia.
    </p>

    <h2>10. Contato</h2>
    <p>
      Dúvidas? Escreva para <a href="mailto:contato@igluapp.com">contato@igluapp.com</a>.
    </p>
  </LegalShell>
);

export default Terms;
