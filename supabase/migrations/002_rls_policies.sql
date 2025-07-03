-- RLSを有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- カスタムクレームを取得する関数
CREATE OR REPLACE FUNCTION auth.company_id() 
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() 
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE;

-- 会社ポリシー
CREATE POLICY "Companies can view their own data" ON companies
  FOR SELECT USING (id = auth.company_id());

CREATE POLICY "Companies can update their own data" ON companies
  FOR UPDATE USING (id = auth.company_id());

-- ユーザーポリシー
CREATE POLICY "Users can view users in their company" ON users
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (company_id = auth.company_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (company_id = auth.company_id() AND auth.user_role() = 'admin');

-- プロジェクトポリシー
CREATE POLICY "Users can view projects in their company" ON projects
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Admins and managers can insert projects" ON projects
  FOR INSERT WITH CHECK (
    company_id = auth.company_id() AND 
    auth.user_role() IN ('admin', 'manager')
  );

CREATE POLICY "Admins and managers can update projects" ON projects
  FOR UPDATE USING (
    company_id = auth.company_id() AND 
    auth.user_role() IN ('admin', 'manager')
  );

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (company_id = auth.company_id() AND auth.user_role() = 'admin');

-- プロジェクトメンバーポリシー
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.company_id = auth.company_id()
    )
  );

CREATE POLICY "Project managers can manage members" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.company_id = auth.company_id()
      AND (auth.user_role() = 'admin' OR projects.manager_id = auth.uid())
    )
  );

-- 写真ポリシー
CREATE POLICY "Users can view photos in their company" ON photos
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Project members can upload photos" ON photos
  FOR INSERT WITH CHECK (
    company_id = auth.company_id() AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = photos.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Photo uploaders can update their photos" ON photos
  FOR UPDATE USING (
    company_id = auth.company_id() AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Admins and photo uploaders can delete photos" ON photos
  FOR DELETE USING (
    company_id = auth.company_id() AND
    (auth.user_role() = 'admin' OR uploaded_by = auth.uid())
  );

-- ドキュメントポリシー
CREATE POLICY "Users can view documents in their company" ON documents
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Project members can upload documents" ON documents
  FOR INSERT WITH CHECK (
    company_id = auth.company_id() AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = documents.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Document uploaders can update their documents" ON documents
  FOR UPDATE USING (
    company_id = auth.company_id() AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Admins and document uploaders can delete documents" ON documents
  FOR DELETE USING (
    company_id = auth.company_id() AND
    (auth.user_role() = 'admin' OR uploaded_by = auth.uid())
  );

-- チャットポリシー
CREATE POLICY "Users can view chats in their company" ON chats
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (
    company_id = auth.company_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "Chat creators and admins can update chats" ON chats
  FOR UPDATE USING (
    company_id = auth.company_id() AND
    (auth.user_role() = 'admin' OR created_by = auth.uid())
  );

CREATE POLICY "Admins can delete chats" ON chats
  FOR DELETE USING (
    company_id = auth.company_id() AND
    auth.user_role() = 'admin'
  );

-- チャットメッセージポリシー
CREATE POLICY "Users can view messages in their company chats" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.company_id = auth.company_id()
    )
  );

CREATE POLICY "Users can send messages to their company chats" ON chat_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND chats.company_id = auth.company_id()
    )
  );

-- レポートポリシー
CREATE POLICY "Users can view reports in their company" ON reports
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Project members can create reports" ON reports
  FOR INSERT WITH CHECK (
    company_id = auth.company_id() AND
    reported_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = reports.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Report creators can update their pending reports" ON reports
  FOR UPDATE USING (
    company_id = auth.company_id() AND
    reported_by = auth.uid() AND
    status = 'pending'
  );

CREATE POLICY "Admins and managers can approve reports" ON reports
  FOR UPDATE USING (
    company_id = auth.company_id() AND
    auth.user_role() IN ('admin', 'manager')
  );

-- スケジュールポリシー
CREATE POLICY "Users can view schedules in their company" ON schedules
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "Users can create their own schedules" ON schedules
  FOR INSERT WITH CHECK (
    company_id = auth.company_id() AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own schedules" ON schedules
  FOR UPDATE USING (
    company_id = auth.company_id() AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own schedules" ON schedules
  FOR DELETE USING (
    company_id = auth.company_id() AND
    user_id = auth.uid()
  );