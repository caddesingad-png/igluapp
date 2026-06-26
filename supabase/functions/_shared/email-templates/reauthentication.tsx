/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação IGLU</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandRow}>
          <Text style={brand}>IGLU</Text>
          <Text style={brandTag}>Atelier de Beleza</Text>
        </Section>
        <Hr style={accentRule} />
        <Heading style={h1}>Confirme sua identidade</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          Este código expira em alguns minutos. Se você não solicitou, pode
          ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const fontStack =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const main = { backgroundColor: '#ffffff', fontFamily: fontStack, margin: 0, padding: 0 }
const container = { maxWidth: '520px', margin: '0 auto', padding: '40px 32px', backgroundColor: '#FFFAF6', borderRadius: '20px', textAlign: 'center' as const }
const brandRow = { textAlign: 'center' as const, margin: '0 0 8px' }
const brand = { fontSize: '22px', fontWeight: 700 as const, letterSpacing: '0.32em', color: '#2C2420', margin: 0 }
const brandTag = { fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: '#9E8E87', margin: '6px 0 0' }
const accentRule = { border: 'none', borderTop: '1px solid #C9928A', width: '40px', margin: '20px auto 28px' }
const h1 = { fontSize: '24px', fontWeight: 600 as const, color: '#2C2420', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#6B5D58', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = {
  display: 'inline-block',
  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
  fontSize: '32px',
  fontWeight: 700 as const,
  letterSpacing: '0.4em',
  color: '#2C2420',
  backgroundColor: '#F7F3EF',
  padding: '18px 28px',
  borderRadius: '16px',
  margin: '0 0 12px',
}
const divider = { border: 'none', borderTop: '1px solid #EDE5DE', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#BFB0AA', lineHeight: '1.6', margin: 0 }
