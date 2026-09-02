import { Linking, StyleSheet, Text, View } from 'react-native';

import { parseMarkdown, type Block, type Inline } from '@/src/chat/markdownParse';
import { color, font } from '@/src/theme/tokens';

type Tone = 'user' | 'agent';

type MarkdownTextProps = {
  body: string;
  tone?: Tone;
};

function Inlines({ inlines, tone }: { inlines: Inline[]; tone: Tone }) {
  const codeStyle = tone === 'user' ? styles.codeOnDark : styles.codeOnLight;
  return (
    <>
      {inlines.map((inline, index) => {
        switch (inline.type) {
          case 'bold':
            return (
              <Text key={index} style={styles.bold}>
                <Inlines inlines={inline.children} tone={tone} />
              </Text>
            );
          case 'italic':
            return (
              <Text key={index} style={styles.italic}>
                <Inlines inlines={inline.children} tone={tone} />
              </Text>
            );
          case 'code':
            return (
              <Text key={index} style={[styles.inlineCode, codeStyle]}>
                {inline.text}
              </Text>
            );
          case 'link':
            return (
              <Text
                key={index}
                accessibilityRole="link"
                style={styles.link}
                onPress={() => Linking.openURL(inline.href)}
              >
                {inline.text}
              </Text>
            );
          default:
            return <Text key={index}>{inline.text}</Text>;
        }
      })}
    </>
  );
}

function BlockView({ block, tone }: { block: Block; tone: Tone }) {
  const textColor = tone === 'user' ? styles.user : styles.agent;
  switch (block.type) {
    case 'heading':
      return (
        <Text style={[styles.base, styles.heading, textColor]}>
          <Inlines inlines={block.inlines} tone={tone} />
        </Text>
      );
    case 'code':
      return (
        <View style={[styles.codeBlock, tone === 'user' ? styles.codeOnDark : styles.codeOnLight]}>
          <Text style={[styles.mono, textColor]}>{block.text}</Text>
        </View>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.base, styles.marker, textColor]}>
                {block.ordered ? `${index + 1}.` : '•'}
              </Text>
              <Text style={[styles.base, styles.listText, textColor]}>
                <Inlines inlines={item} tone={tone} />
              </Text>
            </View>
          ))}
        </View>
      );
    default:
      return (
        <Text style={[styles.base, textColor]}>
          <Inlines inlines={block.inlines} tone={tone} />
        </Text>
      );
  }
}

export function MarkdownText({ body, tone = 'agent' }: MarkdownTextProps) {
  const blocks = parseMarkdown(body);
  return (
    <View style={styles.root}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} tone={tone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  base: {
    fontFamily: font.family,
    fontSize: font.size.body,
    lineHeight: 24,
  },
  agent: { color: color.greyDark },
  user: { color: color.white },
  bold: { fontFamily: font.familyMedium },
  italic: { fontStyle: 'italic' },
  heading: { fontFamily: font.familyMedium, fontSize: 18 },
  link: { textDecorationLine: 'underline', color: color.accentBlue },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 14,
    borderRadius: 4,
  },
  codeOnLight: { backgroundColor: color.offWhite },
  codeOnDark: { backgroundColor: 'rgba(255,255,255,0.14)' },
  codeBlock: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
  list: { gap: 4 },
  listItem: { flexDirection: 'row', gap: 8 },
  marker: { minWidth: 18, textAlign: 'right' },
  listText: { flex: 1 },
});
