import { Redirect } from 'expo-router';

/** Onglet factice : le bouton central ouvre directement le formulaire de transaction. */
export default function Add() {
  return <Redirect href="/transaction" />;
}
