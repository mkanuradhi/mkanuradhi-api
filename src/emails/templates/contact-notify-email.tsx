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

interface ContactNotifyEmailProps {
  name: string;
  email: string;
  message: string;
  city?: string;
  country?: string;
  browser?: string;
  os?: string;
}

export const ContactNotifyEmail = ({
  name,
  email,
  message,
  city,
  country,
  browser,
  os,
}: ContactNotifyEmailProps) => {
  const { colors } = emailConfig;

  return (
    <Html>
      <Head />
      <Preview>New message received from your contact form</Preview>
      <Body style={styles.body as any}>
        <Container style={styles.container as any}>
          
          {/* Icon */}
          <Section style={styles.iconSection as any}>
            <div
              style={{
                width: '70px',
                height: '70px',
                margin: '0 auto 25px',
                backgroundColor: colors.accent,
                borderRadius: '50%',
                textAlign: 'center',
                lineHeight: '70px',
              } as any}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '34px',
                  fontWeight: 'bold',
                } as any}
              >
                ✉
              </span>
            </div>
          </Section>

          {/* Heading */}
          <Section style={styles.content as any}>
            <Heading style={styles.heading as any}>New Message Received</Heading>

            {/* Details Box */}
            <Section style={styles.infoBox as any}>
              <Text style={styles.infoTitle as any}>Sender Details</Text>
              <Text style={styles.infoText as any}><b>Name:</b> {name}</Text>
              <Text style={styles.infoText as any}><b>Email:</b> {email}</Text>

              {(city || country) && (
                <Text style={styles.infoText as any}>
                  <b>Location:</b> {city || ''} {country ? `(${country})` : ''}
                </Text>
              )}

              {(browser || os) && (
                <Text style={styles.infoText as any}>
                  <b>Device:</b> {browser || ''} {os ? `on ${os}` : ''}
                </Text>
              )}
            </Section>

            {/* Message */}
            <Section style={styles.messageBox as any}>
              <Text style={styles.infoTitle as any}>Message</Text>
              <Text style={styles.messageText as any}>{message}</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer as any}>
            <Text style={styles.footerText as any}>
              This is an automated notification from www.mkanuradhi.com
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
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
    padding: '40px 40px 0',
    textAlign: 'center' as const,
  },
  content: {
    padding: '0 40px 40px',
    textAlign: 'left' as const,
  },
  heading: {
    margin: '0 0 20px',
    color: emailConfig.colors.text.primary,
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center' as const,
  },
  infoBox: {
    backgroundColor: emailConfig.colors.background.gray,
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  messageBox: {
    backgroundColor: emailConfig.colors.background.grayLight,
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  infoTitle: {
    margin: '0 0 12px',
    color: emailConfig.colors.text.primary,
    fontSize: '15px',
    fontWeight: 'bold',
  },
  infoText: {
    margin: '0 0 4px',
    color: emailConfig.colors.text.secondary,
    fontSize: '14px',
  },
  messageText: {
    margin: '0',
    color: emailConfig.colors.text.secondary,
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  footer: {
    padding: '25px 40px',
    backgroundColor: emailConfig.colors.background.grayLight,
    textAlign: 'center' as const,
    borderTop: `1px solid ${emailConfig.colors.border}`,
  },
  footerText: {
    margin: '0',
    color: emailConfig.colors.text.light,
    fontSize: '12px',
  },
};

export default ContactNotifyEmail;
