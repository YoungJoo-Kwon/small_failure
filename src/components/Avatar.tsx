// 아바타 표시 컴포넌트: 현재 사용자의 경우 실시간 프로필 아바타 사용

import React, { useEffect, useState } from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { getDisplayAvatarSource } from "../lib/avatarHelper";

interface AvatarProps {
  authorId?: string | null;
  snapshotAvatarUrl?: string | null;
  size?: number;
  style?: any;
}

export default function Avatar({ 
  authorId, 
  snapshotAvatarUrl, 
  size = 40,
  style 
}: AvatarProps) {
  const [source, setSource] = useState<{ uri?: string; require?: ImageSourcePropType } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const avatarSource = await getDisplayAvatarSource(authorId, snapshotAvatarUrl);
        if (!cancelled) {
          setSource(avatarSource);
        }
      } catch (error) {
        console.error("[Avatar] Error loading avatar:", error);
        if (!cancelled) {
          setSource(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorId, snapshotAvatarUrl]);

  if (loading) {
    return (
      <View style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#e9ecef",
          justifyContent: "center",
          alignItems: "center",
        },
        style
      ]}>
        <Text style={{ fontSize: size * 0.4 }}>🙂</Text>
      </View>
    );
  }

  if (source) {
    if (source.require) {
      return (
        <View style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          },
          style
        ]}>
          <Image 
            source={source.require} 
            style={{ width: "100%", height: "100%" }} 
            resizeMode="cover" 
          />
        </View>
      );
    } else if (source.uri) {
      return (
        <View style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          },
          style
        ]}>
          <Image 
            source={{ uri: source.uri }} 
            style={{ width: "100%", height: "100%" }} 
            resizeMode="cover" 
          />
        </View>
      );
    }
  }

  return (
    <View style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#e9ecef",
        justifyContent: "center",
        alignItems: "center",
      },
      style
    ]}>
      <Text style={{ fontSize: size * 0.4 }}>🙂</Text>
    </View>
  );
}

