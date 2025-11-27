export const emailConfig = {
  // Brand colors
  colors: {
    primary: '#f4e9d7',
    secondary: '#e7e8e7',
    accent: '#8b2f19',

    text: {
      primary: '#212529',
      secondary: '#4B5563',
      light: '#9CA3AF',
    },

    background: {
      white: '#FFFFFF',
      gray: '#f3f4f6',
      grayLight: '#f5f5f2',
    },

    border: '#dbdada',
  },
 
  // Personal info
  sender: {
    name: 'M K A Ariyaratne',
    title: 'Senior Lecturer',
    email: process.env.FROM_EMAIL_ADDRESS || '',
    website: 'https://www.mkanuradhi.com',
  },
  
};