import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Img,
  Preview,
  Hr,
} from '@react-email/components';
import { FastifyInstance } from 'fastify';

interface VerifyAccountEmailProps {
  verificationLink: string;
  userName: string;
}


const VerifyAccountEmail = (
  fastify: FastifyInstance,
    {
        verificationLink,
        userName,
    }: VerifyAccountEmailProps) => {
    const LOGO_URL = fastify.config.LOGO_URL;
  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <title>Verify your Whisper account</title>
        <meta
          name="description"
          content="Verify your email address to activate your Whisper account."
        />
      </Head>

      <Preview>
        Welcome to Whisper, {userName}. Verify your email to get started.
      </Preview>

      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f9fafb', // background.light
        }}
      >
        <Container
          style={{
            maxWidth: '520px',
            margin: '40px auto',
            backgroundColor: '#f3f4f6', // surface.light
            borderRadius: '12px',
            padding: '32px',
            fontFamily:
              "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#1f2937', // text.primaryLight
            letterSpacing: '0.02rem',
            lineHeight: '1.6',
          }}
        >
          {/* Logo */}
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Img
              src={LOGO_URL}
              alt="Whisper Logo"
              width="160"
              style={{
                margin: '0 auto',
              }}
            />
          </Section>

          {/* Heading */}
          <Section>
            <Text
              style={{
                fontSize: '26px',
                fontWeight: '700',
                marginBottom: '12px',
                color: '#1f2937',
              }}
            >
              Welcome to Whisper, {userName}
            </Text>

            <Text
              style={{
                fontSize: '15px',
                marginBottom: '24px',
                color: '#374151',
              }}
            >
              You’re almost ready. Please verify that this is your email address
              to activate your Whisper account and start secure conversations.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Button
              href={verificationLink}
              style={{
                backgroundColor: '#0891b2', // primary.light
                color: '#ffffff',
                padding: '14px 22px',
                fontSize: '15px',
                borderRadius: '8px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Verify email address
            </Button>
          </Section>

          {/* Info text */}
          <Section>
            <Text
              style={{
                fontSize: '13px',
                color: '#6b7280', // text.mutedLight
                marginBottom: '16px',
              }}
            >
              This verification link will expire in 10 minutes. If you did not
              create a Whisper account, you can safely ignore this email.
            </Text>

            <Hr
              style={{
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                margin: '20px 0',
              }}
            />

            <Text
              style={{
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Need help? Contact us at{' '}
              <Link
                href="mailto:wecare.whisper@gmail.com"
                style={{
                  color: '#0891b2',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                wecare.whisper@gmail.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerifyAccountEmail;
