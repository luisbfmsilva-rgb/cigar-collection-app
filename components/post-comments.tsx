import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

interface Comment {
  id: number;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: string;
}

interface PostCommentsProps {
  postId: number;
  comments: Comment[];
  onAddComment: (postId: number, content: string) => void;
}

export function PostComments({ postId, comments, onAddComment }: PostCommentsProps) {
  const colors = useColors();
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(postId, newComment);
      setNewComment("");
    }
  };

  if (!isExpanded) {
    return (
      <Pressable
        onPress={() => setIsExpanded(true)}
        className="p-3 items-center"
      >
        <Text className="text-sm text-primary font-medium">
          Ver {comments.length} comentário{comments.length !== 1 ? "s" : ""}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="border-t border-border pt-3">
      {/* Comments List */}
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View className="mb-3 flex-row gap-2">
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "20" }}
            >
              <Text style={{ fontSize: 14 }}>{item.userPhoto}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-foreground text-xs">
                  {item.userName}
                </Text>
                <Text className="text-xs text-muted">{item.createdAt}</Text>
              </View>
              <Text className="text-foreground text-xs mt-1">{item.content}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />

      {/* Add Comment Input */}
      <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-border">
        <TextInput
          placeholder="Adicionar comentário..."
          placeholderTextColor={colors.muted}
          value={newComment}
          onChangeText={setNewComment}
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm"
        />
        <Pressable
          onPress={handleAddComment}
          disabled={!newComment.trim()}
          className="bg-primary rounded-lg px-3 py-2 items-center justify-center"
          style={{ opacity: newComment.trim() ? 1 : 0.5 }}
        >
          <Text style={{ fontSize: 16 }}>📤</Text>
        </Pressable>
      </View>
    </View>
  );
}
