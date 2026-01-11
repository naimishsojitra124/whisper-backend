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

interface EmailChangeNotificationEmailProps {
  displayName: string;
  newEmail: string;
  time: string;
  ip: string;
  device: string;
  location: string;
}

const EmailChangeNotificationEmail = (
  fastify: FastifyInstance,
  {
    displayName,
    newEmail,
    time,
    ip,
    device,
    location,
  }: EmailChangeNotificationEmailProps
) => {
  const LOGO_URL = fastify.config.LOGO_URL;

  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <title>Email change requested</title>
      </Head>

      <Preview>
        A request was made to change your Whisper account email
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
            Email change requested
          </Text>

          {/* Intro */}
          <Text style={{ fontSize: "15px", marginBottom: "20px" }}>
            Hi {displayName}, we received a request to change the email address
            associated with your Whisper account.
          </Text>

          {/* Details table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            <tbody>
              <Row label="📧 New email" value={newEmail} />
              <Row label="💻 Device" value={device} />
              <Row label="📍 Location" value={location} />
              <Row label="🌐 IP address" value={ip} />
              <Row label="🕒 Time" value={time} />
            </tbody>
          </table>

          {/* Clarification */}
          <Text
            style={{
              fontSize: "14px",
              marginBottom: "12px",
            }}
          >
            <b>No changes have been made yet.</b> The email address on your
            account will only be updated after the new email is verified.
          </Text>

          {/* Security warning */}
          <Text
            style={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            If you did not request this change, we recommend securing your
            account immediately by changing your password and reviewing active
            devices.
          </Text>

          <Hr
            style={{
              margin: "20px 0",
              borderTop: "1px solid #e5e7eb",
            }}
          />

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

/* ---------- Shared row component (same as NewDeviceLoginEmail) ---------- */

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

export default EmailChangeNotificationEmail;
