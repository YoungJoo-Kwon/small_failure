// components/attach/AttachModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal } from "react-native";
import { colors, typography, spacing, borderRadius } from "../../styles/theme";
import Button from "../common/Button";
import Card from "../common/Card";
import { auth } from "../../lib/firebase";
import { listenMyPosts, searchPostsByTitlePrefix } from "../../lib/posts";
import { ensureAnonSignIn } from "../../../src/lib/auth";

type Item = { id: string; title: string; body?: string; lessons?: string; };

export default function AttachModal({
  visible, onClose, onSelect, excludeId,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (postId: string) => void; // 선택하면 childId 전달
  excludeId?: string; // 자기 자신 제외
}) {
  const uid = auth.currentUser?.uid ?? null;

  const [tab, setTab] = useState<"mine"|"search"|"recent"|"paste">("mine");
  const [mine, setMine] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState<Item[]>([]);
  const [paste, setPaste] = useState("");

  useEffect(() => {
    if (!visible) return;
    if (uid) {
      const unsub = listenMyPosts(uid, list => {
        setMine(list.filter(p => p.id !== excludeId));
      });
      return () => unsub && unsub();
    }
  }, [visible, uid, excludeId]);

  useEffect(() => {
    if (!visible) return;
    if (tab !== "search") return;
    if (!q.trim()) { setSearch([]); return; }
    const unsub = searchPostsByTitlePrefix(q.trim(), list => {
      setSearch(list.filter(p => p.id !== excludeId));
    });
    return () => unsub && unsub();
  }, [visible, tab, q, excludeId]);

  useEffect(() => {
    if (!visible) return;
    ensureAnonSignIn().catch(console.error);  // ✅ 모달이 열릴 때 익명 로그인 보장
  }, [visible]);

  const renderItem = (p: Item) => (
    <TouchableOpacity onPress={() => onSelect(p.id)} style={{ marginBottom: spacing.sm }}>
      <Card style={{ padding: spacing.md, backgroundColor: colors.background.light }}>
        <Text style={[typography.body, { color: colors.text.primary }]} numberOfLines={1}>{p.title}</Text>
        {p.body ? (
          <Text style={[typography.caption, { color: colors.text.secondary }]} numberOfLines={2}>{p.body}</Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );

  const list = tab === "mine" ? mine : search;

  // URL/ID 파서: /post/{id} 형태도 허용
  const parseId = (s: string) => {
    const trimmed = s.trim();
    const m = trimmed.match(/\/post\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : trimmed;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.3)' }}>
        <View style={{
          backgroundColor: colors.background.light,
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          padding: spacing.lg, maxHeight: '80%',
        }}>
          {/* 탭 */}
          <View style={{ flexDirection:'row', columnGap: spacing.sm, marginBottom: spacing.md }}>
            {["mine","search","recent","paste"].map(k => (
              <Button
                key={k}
                title={k==="mine"?"내 글":k==="search"?"검색":k==="recent"?"최근":"URL/ID"}
                size="sm"
                variant={tab===k?"primary":"secondary"}
                style={tab===k ? { backgroundColor: colors.accent, borderColor: colors.accent } : undefined}
                titleStyle={tab===k ? { color: 'white' } : undefined}
                onPress={()=>setTab(k as any)}
              />
            ))}
          </View>

          {/* 컨텐츠 */}
          {tab === "mine" && (
            <FlatList
              data={list}
              keyExtractor={(i)=>i.id}
              renderItem={({item})=>renderItem(item)}
            />
          )}

          {tab === "search" && (
            <View>
              <TextInput
                placeholder="제목으로 검색"
                value={q}
                onChangeText={setQ}
                style={{
                  borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
                  padding: spacing.md, color: colors.text.primary, backgroundColor: colors.background.light,
                  marginBottom: spacing.md,
                }}
              />
              <FlatList
                data={list}
                keyExtractor={(i)=>i.id}
                renderItem={({item})=>renderItem(item)}
              />
            </View>
          )}

          {tab === "recent" && (
            <Text style={[typography.caption, {color: colors.text.secondary}]}>
              (선택) 앱 전체에 “최근 본 글” 저장 로직을 추가한 뒤 여기에 보여주세요.
            </Text>
          )}

          {tab === "paste" && (
            <View>
              <TextInput
                placeholder="붙일 글의 URL 또는 ID"
                value={paste}
                onChangeText={setPaste}
                style={{
                  borderWidth:1, borderColor:colors.gray[300], borderRadius:borderRadius.md,
                  padding:spacing.md, color:colors.text.primary, backgroundColor:colors.background.light,
                }}
              />
              <Button
                title="붙이기"
                size="sm"
                variant="primary"
                style={{ marginTop: spacing.sm, backgroundColor: colors.accent, borderColor: colors.accent }}
                titleStyle={{ color: 'white' }}
                onPress={()=> {
                  const id = parseId(paste);
                  if (id) onSelect(id);
                }}
              />
            </View>
          )}

          <Button title="닫기" variant="secondary" style={{ marginTop: spacing.md }} onPress={onClose}/>
        </View>
      </View>
    </Modal>
  );
}
