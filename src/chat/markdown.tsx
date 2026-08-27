import { StyleSheet, Text, type TextStyle } from 'react-native';

import { color, font } from '@/src/theme/tokens';

type MarkdownTextProps = {
  body: string;
  tone?: 'user' | 'agent';
};

export function MarkdownText({ body, tone = 'agent' }: MarkdownTextProps) {
  const colorStyle: TextStyle =
    tone === 'user' ? styles.user : styles.agent;
  const parts = body.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={[styles.base, colorStyle]}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <Text key={index} style={styles.bold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: font.family,
    fontSize: font.size.body,
    lineHeight: 24,
  },
  agent: { color: color.greyDark },
  user: { color: color.white },
  bold: { fontFamily: font.familyMedium },
});
