import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Img,
  Preview,
  Hr,
} from "@react-email/components";
import { FastifyInstance } from "fastify";

interface PasswordChangedEmailProps {
  userName: string;
  time: string;
  ip: string;
  device: string;
  location: string;
}

const PasswordChangedEmail = (
  fastify: FastifyInstance,
  { userName, time, ip, device, location }: PasswordChangedEmailProps
) => {
  const LOGO_URL = fastify.config.LOGO_URL;
  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <title>Password changed</title>
      </Head>

      <Preview>Your Whisper password was changed</Preview>

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
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img src={LOGO_URL} alt="Whisper" width="140" />
          </Section>

          <Text
            style={{
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Password changed
          </Text>

          <Text style={{ fontSize: "15px", marginBottom: "20px" }}>
            Hi {userName}, your Whisper account password was changed
            successfully.
          </Text>

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
              <Row label="📍 Location" value={location} />
              <Row label="🌐 IP Address" value={ip} />
            </tbody>
          </table>

          <Text
            style={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            If you didn’t change your password, your account may be compromised.
            Please reset your password immediately and contact support.
          </Text>

          <Hr style={{ margin: "20px 0", borderTop: "1px solid #e5e7eb" }} />

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

export default PasswordChangedEmail;

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
