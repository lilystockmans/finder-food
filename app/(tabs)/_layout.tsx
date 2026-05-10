import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Tabs, router, Redirect } from 'expo-router';
import { Icon } from '../../components/Icon';
import { Colors, Typography } from '../../constants/tokens';
import { useAppStore } from '../../store';
import { loadProfile } from '../../lib/profile';

function TabBar({ state, navigation }: any) {
  const { openEntry } = useAppStore();
  const routes = state.routes;

  const icons = ['home', 'chart', null, 'bookmark', 'user'] as const;
  const labels = ['Home', 'Progress', '', 'Saved', 'Profile'];

  return (
    <View style={styles.bar}>
      {routes.map((route: any, index: number) => {
        const isFab = index === 2;
        const isFocused = state.index === index;

        if (isFab) {
          return (
            <TouchableOpacity
              key="fab"
              onPress={() => {
                openEntry();
                router.push('/meal-entry');
              }}
              activeOpacity={0.85}
              style={styles.fab}
            >
              <Icon name="plus" size={26} color={Colors.white} sw={2.2} />
            </TouchableOpacity>
          );
        }

        const iconName = icons[index];
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.8}
            style={styles.tab}
          >
            <Icon
              name={iconName as any}
              size={22}
              color={isFocused ? Colors.ice : Colors.muted}
              sw={isFocused ? 1.9 : 1.6}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {labels[index]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const profile = loadProfile();
  if (!profile) return <Redirect href="/onboarding/step-1" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="fab" options={{ href: null }} />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 64;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.forest2,
    height: BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  label: {
    fontFamily: Typography.geist,
    fontSize: 10,
    color: Colors.muted,
  },
  labelActive: {
    color: Colors.ice,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    borderWidth: 4,
    borderColor: Colors.forest2,
    shadowColor: Colors.ember,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
});
