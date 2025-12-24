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

interface NewDeviceLoginEmailProps {
  name: string;
  email: string;
  ip: string;
  device: string;
  location: string;
  time: Date;
}

const NewDeviceLoginEmail = (
  fastify: FastifyInstance,
  { name, email, ip, device, location, time }: NewDeviceLoginEmailProps
) => {
  const LOGO_URL = fastify.config.LOGO_URL;
  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <title>New device sign-in detected</title>
        <meta
          name="description"
          content="A new device signed into your Whisper account."
        />
      </Head>

      <Preview>New device sign-in detected on your Whisper account.</Preview>

      <Body style={{ backgroundColor: "#f9fafb", margin: 0 }}>
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
            <Img
              src={LOGO_URL}
              alt="Whisper"
              width="150"
              style={{ margin: "0 auto" }}
            />
          </Section>

          <Section>
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "12px",
                color: '#1f2937',
              }}
            >
              Hello {name},
            </Text>

            <Text style={{ marginBottom: "20px", fontSize: "15px" }}>
              We detected a sign-in to your Whisper account from a new device.
              If this was you, no action is needed. If not, please secure your
              account immediately.
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
                <Row label="📧 Account" value={email} />
                <Row label="💻 Device" value={device} />
                <Row label="📍 Location" value={location} />
                <Row label="🌐 IP Address" value={ip} />
                <Row
                  label="🕒 Time"
                  value={new Date(time).toLocaleString("en-IN", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  })}
                />
              </tbody>
            </table>

            <Text
              style={{
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              If you don’t recognize this activity, change your password
              immediately and enable two-factor authentication.
              <br />
              Need help? Contact us at{" "}
              <Link
                href="mailto:wecare.whisper@gmail.com"
                style={{
                  color: "#0891b2",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                wecare.whisper@gmail.com
              </Link>
            </Text>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #e5e7eb",
                margin: "24px 0 0",
              }}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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

export default NewDeviceLoginEmail;
