import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@data/repository/store';
import { setUser } from '@data/usecase/UserUseCase';

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<string | null>('/(tabs)/MainPage');
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    const checkUser = async () => {
      try {
        const usersJson = await AsyncStorage.getItem('@users');
        if (usersJson) {
          try {
            const users = JSON.parse(usersJson);
            // 检查是否有有效的用户（用户名、密码、id都存在且不为空）
            const validUser = users.find((u: any) => u.username && u.password && u.id);
            if (validUser) {
              // 把数据存入redux中
              dispatch(setUser(validUser));
              setInitialRoute('/(tabs)/MainPage'); 
              return;
            }else{
              setInitialRoute('/(auth)/login');
              return;
            }
          } catch (parseError) {
            console.error('[Index] JSON解析失败，清除损坏的用户数据:', parseError);
            await AsyncStorage.removeItem('@users');
            setInitialRoute('/(auth)/login');
            return;
          }
        } else {
          setInitialRoute('/(auth)/login');
        }
      } catch (e) {
        setInitialRoute('/(auth)/login');
      }
    };
    checkUser();
  }, []);

  if (!initialRoute) return null; // 或者可以加个 loading 动画
  return <Redirect href='/(tabs)/MainPage' />;
}
  