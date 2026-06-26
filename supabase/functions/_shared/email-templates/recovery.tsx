/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha do {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandRow}>
          <Text style={brand}>IGLU</Text>
          <Text style={brandTag}>Atelier de Beleza</Text>
        </Section>
        <Hr style={accentRule} />
        <Heading style={h1}>Redefinir senha</Heading>
        <Text style={text}>
          Recebemos um pedido para redefinir a senha da sua conta. Clique no
          botão abaixo para criar uma nova senha.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Criar nova senha
          </Button>
        </Section>
        <Text style={textSmall}>
          Se o botão não funcionar, copie e cole este link no navegador:
        </Text>
        <Text style={linkBreak}>{confirmationUrl}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          Se você não solicitou a redefinição, pode ignorar este e-mail com
          segurança — sua senha permanece a mesma.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const fontStack =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const main = { backgroundColor: '#ffffff', fontFamily: fontStack, margin: 0, padding: 0 }
const container = { maxWidth: '520px', margin: '0 auto', padding: '40px 32px', backgroundColor: '#FFFAF6', borderRadius: '20px' }
const brandRow = { textAlign: 'center' as const, margin: '0 0 8px' }
const brand = { fontSize: '22px', fontWeight: 700 as const, letterSpacing: '0.32em', color: '#2C2420', margin: 0 }
const brandTag = { fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: '#9E8E87', margin: '6px 0 0' }
const accentRule = { border: 'none', borderTop: '1px solid #C9928A', width: '40px', margin: '20px auto 28px' }
const h1 = { fontSize: '24px', fontWeight: 600 as const, color: '#2C2420', margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#6B5D58', lineHeight: '1.6', margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#9E8E87', lineHeight: '1.5', margin: '24px 0 8px' }
const linkBreak = { fontSize: '12px', color: '#9E8E87', wordBreak: 'break-all' as const, margin: '0 0 16px' }
const button = { backgroundColor: '#2C2420', color: '#F7F3EF', fontSize: '15px', fontWeight: 600 as const, borderRadius: '999px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const divider = { border: 'none', borderTop: '1px solid #EDE5DE', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#BFB0AA', lineHeight: '1.6', margin: 0, textAlign: 'center' as const }
