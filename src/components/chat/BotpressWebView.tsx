import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../constants';
import { useUserStore } from '../../store/userStore';
import { useChatStore } from '../../store/chatStore';

export default function BotpressWebView() {
  const user = useUserStore((s) => s.user);
  const botId = useChatStore((s) => s.botpressBotId);

  const html = useMemo(() => {
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    const userEmail = user?.email || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: 100%; width: 100%; overflow: hidden; background: #FFFFFF; }
        </style>
      </head>
      <body>
        <script src="https://cdn.botpress.cloud/webchat/v2.5/inject.js"></script>
        <script>
          window.botpressWebChat.init({
            botId: '${botId}',
            configuration: {
              color: '${COLORS.primary}',
              variant: 'full',
              themeMode: 'light',
              fontFamily: 'system-ui',
              radius: 1,
            },
            ${userName ? `userData: { name: '${userName.replace(/'/g, "\\'")}', email: '${userEmail.replace(/'/g, "\\'")}' },` : ''}
          });

          // Auto-open the webchat
          window.botpressWebChat.onEvent(function(event) {
            if (event.type === 'LIFECYCLE.LOADED') {
              window.botpressWebChat.open();
            }
          });
        </script>
      </body>
      </html>
    `;
  }, [botId, user]);

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
