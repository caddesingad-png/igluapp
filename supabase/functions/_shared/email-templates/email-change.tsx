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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandRow}>
          <Text style={brand}>IGLU</Text>
          <Text style={brandTag}>Atelier de Beleza</Text>
        </Section>
        <Hr style={accentRule} />
        <Heading style={h1}>Confirme a alteração de e-mail</Heading>
        <Text style={text}>
          Você pediu para alterar o e-mail da sua conta de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link> para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Confirmar alteração
          </Button>
        </Section>
        <Text style={textSmall}>
          Se o botão não funcionar, copie e cole este link no navegador:
        </Text>
        <Text style={linkBreak}>{confirmationUrl}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          Se você não pediu esta alteração, proteja sua conta imediatamente
          trocando a senha.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#C9928A', textDecoration: 'underline' }
const linkBreak = { fontSize: '12px', color: '#9E8E87', wordBreak: 'break-all' as const, margin: '0 0 16px' }
const button = { backgroundColor: '#2C2420', color: '#F7F3EF', fontSize: '15px', fontWeight: 600 as const, borderRadius: '999px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const divider = { border: 'none', borderTop: '1px solid #EDE5DE', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#BFB0AA', lineHeight: '1.6', margin: 0, textAlign: 'center' as const }
