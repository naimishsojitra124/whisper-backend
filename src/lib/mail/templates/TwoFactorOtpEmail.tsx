import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Preview,
} from "@react-email/components";
import { FastifyInstance } from "fastify";

interface TwoFactorOtpEmailProps {
  userName: string;
  otp: string;
}

const TwoFactorOtpEmail = (
  fastify: FastifyInstance,
  { userName, otp }: TwoFactorOtpEmailProps
) => {
  const LOGO_URL = fastify.config.LOGO_URL;
  const displayOtp = formatOtp(otp);

  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <title>Your Whisper verification code</title>
      </Head>

      <Preview>Your Whisper verification code: {otp}</Preview>

      <Body style={{ backgroundColor: "#f9fafb", padding: "24px" }}>
        <Container
          style={{
            maxWidth: "520px",
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
            padding: "32px",
            fontFamily:
              "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#1f2937",
          }}
        >
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img src={LOGO_URL} alt="Whisper" width="140" />
          </Section>

          <Text style={{ fontSize: "20px", fontWeight: 700 }}>
            Two-factor authentication code
          </Text>

          <Text style={{ fontSize: "15px", marginBottom: "16px" }}>
            Hi {userName}, use the following code to complete your two-factor
            authentication setup.
          </Text>

          <Text
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "6px",
              textAlign: "center",
              margin: "24px 0",
            }}
          >
            {displayOtp}
          </Text>

          <Text style={{ fontSize: "13px", color: "#6b7280" }}>
            This code will expire in 10 minutes. If you did not request this,
            secure your account immediately.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TwoFactorOtpEmail;

function formatOtp(otp: string): string {
  if (otp.length % 2 !== 0) return otp; // safety fallback

  const mid = otp.length / 2;
  return `${otp.slice(0, mid)}-${otp.slice(mid)}`;
}
