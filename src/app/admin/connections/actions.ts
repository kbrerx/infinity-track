'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Acciones para Cuentas de Anuncios (Gasto)
export async function addAdAccount(formData: FormData) {
  const name = formData.get('name') as string;
  const ad_account_id = formData.get('ad_account_id') as string;
  const access_token = formData.get('access_token') as string;

  const { error } = await supabase.from('meta_ad_accounts').insert([
    { name, ad_account_id, access_token }
  ]);

  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

export async function deleteAdAccount(id: string) {
  const { error } = await supabase.from('meta_ad_accounts').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

// Acciones para InfinityPixels (Tracking)
export async function addPixel(formData: FormData) {
  const name = formData.get('name') as string;
  const pixel_id = formData.get('pixel_id') as string;
  const access_token = formData.get('access_token') as string;
  const domain_filter = formData.get('domain_filter') as string;

  const { error } = await supabase.from('meta_pixels').insert([
    { name, pixel_id, access_token, domain_filter }
  ]);

  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

export async function deletePixel(id: string) {
  const { error } = await supabase.from('meta_pixels').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

export async function updatePixel(id: string, domain_filter: string) {
  const { error } = await supabase
    .from('meta_pixels')
    .update({ domain_filter })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

// Acciones para Integraciones (Marketplace)
export async function addIntegration(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const hottok = formData.get('hottok') as string;

  const { error } = await supabase.from('integrations').insert([
    { 
      name, 
      type, 
      config: { hottok } 
    }
  ]);

  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

export async function deleteIntegration(id: string) {
  const { error } = await supabase.from('integrations').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/connections');
  return { success: true };
}

// Alias para compatibilidad parcial (si se requiere)
export const deleteConnection = deleteAdAccount;
