import 'react-native';

declare module '*.css';
declare module '*.css' {
  const content: any;
  export default content;
}

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface ImageBackgroundProps {
    className?: string;
  }
}
