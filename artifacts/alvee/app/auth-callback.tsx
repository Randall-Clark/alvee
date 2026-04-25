import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(tabs)");
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D" }}>
      <ActivityIndicator color="#C9A84C" size="large" />
    </View>
  );
}
