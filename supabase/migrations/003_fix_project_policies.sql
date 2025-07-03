-- プロジェクト関連のポリシーを修正

-- 既存のプロジェクトポリシーを削除
DROP POLICY IF EXISTS "Users can view projects in their company" ON projects;
DROP POLICY IF EXISTS "Admins and managers can insert projects" ON projects;
DROP POLICY IF EXISTS "Admins and managers can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

-- 新しいプロジェクトポリシー
CREATE POLICY "Users can view projects in their company" ON projects
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects in their company" ON projects
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their company" ON projects
  FOR UPDATE USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete projects in their company" ON projects
  FOR DELETE USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    ) AND (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'admin'
  );