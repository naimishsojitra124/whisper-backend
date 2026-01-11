import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Preview,
  Hr,
  Link,
} from "@react-email/components";
import { FastifyInstance } from "fastify";

interface TwoFactorEnabledEmailProps {
  userName: string;
  time: string;
  ip: string;
  device: string;
}

const TwoFactorEnabledEmail = (
  fastify: FastifyInstance,
  { userName, time, ip, device }: TwoFactorEnabledEmailProps
) => {
  const LOGO_URL = fastify.config.LOGO_URL;

  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <title>Two-factor authentication enabled</title>
      </Head>

      <Preview>
        Two-factor authentication has been enabled on your Whisper account
      </Preview>

      <Body style={{ backgroundColor: "#f9fafb", margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "520px",
            margin: "40px auto",
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
            padding: "32px",
            fontFamily:
              "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#1f2937",
            lineHeight: "1.6",
          }}
        >
          {/* Logo */}
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img src={LOGO_URL} alt="Whisper" width="140" />
          </Section>

          {/* Heading */}
          <Text
            style={{
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Two-factor authentication enabled
          </Text>

          {/* Intro */}
          <Text style={{ fontSize: "15px", marginBottom: "20px" }}>
            Hi {userName}, two-factor authentication (2FA) has been successfully
            enabled on your Whisper account.
          </Text>

          {/* Details */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            <tbody>
              <Row label="🕒 Time" value={time} />
              <Row label="💻 Device" value={device} />
              <Row label="🌐 IP Address" value={ip} />
            </tbody>
          </table>

          {/* Warning */}
          <Text
            style={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            If you did not enable two-factor authentication, your account may be
            compromised. We recommend changing your password immediately and
            reviewing your active devices.
          </Text>

          <Hr style={{ margin: "20px 0", borderTop: "1px solid #e5e7eb" }} />

          {/* Support */}
          <Text style={{ fontSize: "13px", color: "#6b7280" }}>
            Need help? Contact{" "}
            <Link
              href="mailto:wecare.whisper@gmail.com"
              style={{ color: "#0891b2", textDecoration: "none" }}
            >
              wecare.whisper@gmail.com
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TwoFactorEnabledEmail;


const Row = ({ label, value }: { label: string; value: string }) => (
  <tr>
    <td
      style={{
        padding: "8px 12px",
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        fontWeight: 600,
        width: "40%",
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: "8px 12px",
        border: "1px solid #e5e7eb",
      }}
    >
      {value}
    </td>
  </tr>
);
