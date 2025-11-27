import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { emailConfig } from '../config/email-config';

interface AcknowledgmentEmailProps {
  recipientName: string;
}

export const ContactAckEmail = ({ recipientName }: AcknowledgmentEmailProps) => {
  const { colors, sender } = emailConfig;

  return (
    <Html>
      <Head />
      <Preview>Thank you for reaching out! Your message has been received.</Preview>
      <Body style={styles.body as any}>
        <Container style={styles.container as any}>
          {/* Success Icon */}
          <Section style={styles.iconSection as any}>
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 30px',
                backgroundColor: colors.accent,
                borderRadius: '50%',
                textAlign: 'center',
                lineHeight: '80px',
              } as any}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '40px',
                  fontWeight: 'bold',
                } as any}
              >
                ✓
              </span>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={styles.content as any}>
            <Heading style={styles.heading as any}>Thank You for Reaching Out!</Heading>
            
            <Text style={styles.mainText as any}>
              Hi {recipientName}, thank you for getting in touch! I've received your message and appreciate you reaching out.
            </Text>

            {/* Info Box */}
            <Section style={styles.infoBox as any}>
              <Text style={styles.infoTitle as any}>What happens next?</Text>
              <Text style={styles.infoText as any}>
                I will review your message and get back to you as soon as possible. In the meantime, feel free to explore my work and projects on the website.
              </Text>
            </Section>

            <Text style={styles.siSummary as any}>
              ඔබගේ පණිවිඩය ලැබී ඇත. හැකි ඉක්මණින් ඔබට පිළිතුරක් ලබා දෙන්නෙමි.
            </Text>

            {/* Signature */}
            <Section style={styles.signature as any}>
              <Text style={styles.signatureText as any}>
                Warm regards,<br />
                <strong style={{ color: colors.text.primary, fontSize: '16px' } as any}>
                  {sender.name}
                </strong>
                {sender.title && (
                  <>
                    <br />
                    <span style={{ color: colors.text.light, fontSize: '13px' } as any}>
                      {sender.title}
                    </span>
                  </>
                )}
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer as any}>
            <Text style={styles.footerText as any}>
              This is an automated confirmation. Please do not reply to this email, as replies are not monitored.
            </Text>
            <Text style={styles.footerCopyright as any}>
              © {new Date().getFullYear()} {sender.name}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    margin: '0',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: emailConfig.colors.primary,
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: emailConfig.colors.background.white,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  iconSection: {
    padding: '50px 40px 0',
    textAlign: 'center' as const,
  },
  content: {
    padding: '0 40px 50px',
    textAlign: 'center' as const,
  },
  heading: {
    margin: '0 0 20px',
    color: emailConfig.colors.text.primary,
    fontSize: '28px',
    fontWeight: '700',
  },
  mainText: {
    margin: '0 0 30px',
    color: emailConfig.colors.text.secondary,
    fontSize: '16px',
    lineHeight: '1.6',
  },
  infoBox: {
    backgroundColor: emailConfig.colors.background.gray,
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '30px',
    textAlign: 'left' as const,
  },
  infoTitle: {
    margin: '0 0 12px',
    color: emailConfig.colors.text.primary,
    fontSize: '15px',
    fontWeight: 'bold',
    lineHeight: '1.6',
  },
  infoText: {
    margin: '0',
    color: emailConfig.colors.text.secondary,
    fontSize: '14px',
    lineHeight: '1.6',
  },
  siSummary: {
    margin: '0 0 30px',
    color: emailConfig.colors.text.light,
    fontSize: '13px',
    lineHeight: '1.6',
    opacity: 0.8,
  },
  signature: {
    marginTop: '40px',
    paddingTop: '30px',
    borderTop: `1px solid ${emailConfig.colors.border}`,
  },
  signatureText: {
    margin: '0',
    color: emailConfig.colors.text.secondary,
    fontSize: '14px',
    lineHeight: '1.6',
  },
  footer: {
    padding: '30px 40px',
    backgroundColor: emailConfig.colors.background.grayLight,
    textAlign: 'center' as const,
    borderTop: `1px solid ${emailConfig.colors.border}`,
  },
  footerText: {
    margin: '0 0 8px',
    color: emailConfig.colors.text.light,
    fontSize: '12px',
    lineHeight: '1.4',
  },
  footerCopyright: {
    margin: '0',
    color: emailConfig.colors.text.light,
    fontSize: '12px',
  },
};

export default ContactAckEmail;