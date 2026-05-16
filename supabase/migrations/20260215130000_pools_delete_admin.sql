-- El admin de una polla puede eliminarla (cascade borra miembros, pronósticos, reglas, honor).
DROP POLICY IF EXISTS "pools_delete_admin" ON pools;
CREATE POLICY "pools_delete_admin" ON pools FOR DELETE USING (admin_id = auth.uid());
