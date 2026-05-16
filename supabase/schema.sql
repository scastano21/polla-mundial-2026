-- Polla Mundialista FIFA 2026 — esquema base + RLS
-- Ejecutar en el SQL Editor de Supabase (orden recomendado: completo de una vez)

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PERFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  timezone      TEXT DEFAULT 'America/Bogota',
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EQUIPOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_en       TEXT,
  code          TEXT UNIQUE NOT NULL,
  group_letter  TEXT NOT NULL,
  flag_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FASES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  order_index   INT NOT NULL
);

-- ─── PARTIDOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id                UUID REFERENCES phases(id),
  match_number            INT UNIQUE NOT NULL,
  group_letter            TEXT,
  home_team_id            UUID REFERENCES teams(id),
  away_team_id            UUID REFERENCES teams(id),
  home_score              INT,
  away_score              INT,
  home_penalties          INT,
  away_penalties          INT,
  match_date              TIMESTAMPTZ NOT NULL,
  venue                   TEXT,
  city                    TEXT,
  country_host            TEXT,
  status                  TEXT DEFAULT 'scheduled',
  elimination_slot_label  TEXT,
  updated_by              UUID REFERENCES profiles(id),
  updated_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(group_letter);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);

-- ─── TABLA DE POSICIONES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_standings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
  group_letter    TEXT NOT NULL,
  position        INT,
  played          INT DEFAULT 0,
  won             INT DEFAULT 0,
  drawn           INT DEFAULT 0,
  lost            INT DEFAULT 0,
  goals_for       INT DEFAULT 0,
  goals_against   INT DEFAULT 0,
  goal_difference INT GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  points          INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id)
);

-- ─── POOLS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  invite_code     TEXT UNIQUE NOT NULL,
  admin_id        UUID REFERENCES profiles(id),
  is_public       BOOLEAN DEFAULT FALSE,
  max_members     INT DEFAULT 100,
  is_premium      BOOLEAN DEFAULT FALSE,
  premium_paid_at TIMESTAMPTZ,
  mp_payment_id   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pool_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id         UUID REFERENCES pools(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points    INT DEFAULT 0,
  exact_scores    INT DEFAULT 0,
  correct_results INT DEFAULT 0,
  rank            INT,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_id, user_id)
);

CREATE TABLE IF NOT EXISTS predictions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pool_id               UUID REFERENCES pools(id) ON DELETE CASCADE,
  match_id              UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_score  INT NOT NULL,
  predicted_away_score  INT NOT NULL,
  predicted_result      TEXT NOT NULL,
  points_earned         INT DEFAULT 0,
  is_locked             BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pool_id, match_id)
);

CREATE TABLE IF NOT EXISTS honor_predictions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pool_id                 UUID REFERENCES pools(id) ON DELETE CASCADE,
  champion_team_id        UUID REFERENCES teams(id),
  runner_up_team_id       UUID REFERENCES teams(id),
  third_place_team_id     UUID REFERENCES teams(id),
  top_scorer_name         TEXT,
  best_player_name        TEXT,
  best_goalkeeper_name    TEXT,
  best_young_player_name  TEXT,
  points_earned           INT DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pool_id)
);

CREATE TABLE IF NOT EXISTS honor_results (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_year         INT DEFAULT 2026,
  champion_team_id        UUID REFERENCES teams(id),
  runner_up_team_id       UUID REFERENCES teams(id),
  third_place_team_id     UUID REFERENCES teams(id),
  top_scorer_name         TEXT,
  best_player_name        TEXT,
  best_goalkeeper_name    TEXT,
  best_young_player_name  TEXT,
  is_final                BOOLEAN DEFAULT FALSE,
  updated_by              UUID REFERENCES profiles(id),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scoring_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id                   UUID REFERENCES pools(id) ON DELETE CASCADE UNIQUE,
  exact_score_points        INT DEFAULT 5,
  correct_result_points     INT DEFAULT 2,
  correct_group_position    INT DEFAULT 2,
  correct_round_of_32       INT DEFAULT 1,
  correct_quarterfinal      INT DEFAULT 2,
  correct_semifinal         INT DEFAULT 3,
  correct_third_place       INT DEFAULT 3,
  correct_runner_up         INT DEFAULT 5,
  correct_champion          INT DEFAULT 10,
  correct_top_scorer        INT DEFAULT 5,
  correct_best_player       INT DEFAULT 3,
  correct_best_goalkeeper   INT DEFAULT 3,
  correct_best_young        INT DEFAULT 2,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name      TEXT,
  donor_email     TEXT,
  amount_cop      INT NOT NULL,
  message         TEXT,
  mp_payment_id   TEXT,
  mp_status       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS result_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID REFERENCES matches(id) ON DELETE SET NULL,
  admin_id        UUID REFERENCES profiles(id),
  old_home_score  INT,
  old_away_score  INT,
  new_home_score  INT,
  new_away_score  INT,
  changed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FUNCIONES SQL ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_points_to_member(
  p_pool_id UUID, p_user_id UUID, p_points_delta INT, p_exact_delta INT, p_result_delta INT
) RETURNS VOID AS $$
BEGIN
  UPDATE pool_members
  SET total_points    = total_points + p_points_delta,
      exact_scores    = exact_scores + p_exact_delta,
      correct_results = correct_results + p_result_delta
  WHERE pool_id = p_pool_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_pool_rankings(p_pool_id UUID) RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY total_points DESC, exact_scores DESC, correct_results DESC, joined_at ASC
           ) AS new_rank
    FROM pool_members WHERE pool_id = p_pool_id
  )
  UPDATE pool_members pm SET rank = r.new_rank FROM ranked r WHERE pm.id = r.id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Funciones SECURITY DEFINER para RLS: evitan recursión infinita cuando una política
-- de `pool_members` (o `pools`/`profiles`) consulta otra vez `pool_members` bajo las mismas políticas.
CREATE OR REPLACE FUNCTION public.user_in_pool(_pool_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members pm
    WHERE pm.pool_id = _pool_id AND pm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.users_share_pool(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members x
    JOIN public.pool_members y ON x.pool_id = y.pool_id
    WHERE x.user_id = _a AND y.user_id = _b
  );
$$;

REVOKE ALL ON FUNCTION public.user_in_pool(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.users_share_pool(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_in_pool(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.users_share_pool(uuid, uuid) TO authenticated, anon, service_role;

-- Invitados: leer una polla solo si conocen el código exacto (no enumera pools).
CREATE OR REPLACE FUNCTION public.pool_by_invite_code(p_code text)
RETURNS TABLE (
  id uuid,
  name text,
  invite_code text,
  max_members int,
  is_premium boolean,
  admin_id uuid,
  member_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.invite_code,
    p.max_members,
    p.is_premium,
    p.admin_id,
    (SELECT count(*)::bigint FROM public.pool_members pm WHERE pm.pool_id = p.id) AS member_count
  FROM public.pools p
  WHERE p.invite_code = upper(trim(p_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.pool_by_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pool_by_invite_code(text) TO authenticated;

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE honor_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE honor_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura pública de datos del torneo
CREATE POLICY "teams_read_all" ON teams FOR SELECT USING (true);
CREATE POLICY "phases_read_all" ON phases FOR SELECT USING (true);
CREATE POLICY "matches_read_all" ON matches FOR SELECT USING (true);
CREATE POLICY "standings_read_all" ON group_standings FOR SELECT USING (true);
CREATE POLICY "honor_results_read_all" ON honor_results FOR SELECT USING (true);

-- Perfiles: cada usuario ve/edita el suyo
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_copool" ON profiles FOR SELECT USING (
  public.users_share_pool(auth.uid(), profiles.id)
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pools: miembros o públicos
CREATE POLICY "pools_select_member_or_public" ON pools FOR SELECT USING (
  is_public = true
  OR admin_id = auth.uid()
  OR public.user_in_pool(id, auth.uid())
);
CREATE POLICY "pools_insert_own" ON pools FOR INSERT WITH CHECK (admin_id = auth.uid());
CREATE POLICY "pools_update_admin" ON pools FOR UPDATE USING (admin_id = auth.uid());
CREATE POLICY "pools_delete_admin" ON pools FOR DELETE USING (admin_id = auth.uid());

CREATE POLICY "pool_members_select_pool" ON pool_members FOR SELECT USING (
  public.user_in_pool(pool_id, auth.uid())
  OR EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_members.pool_id AND p.admin_id = auth.uid())
);
CREATE POLICY "pool_members_insert_self_join" ON pool_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Pronósticos: dueño; lectura entre miembros de la misma polla (transparencia)
CREATE POLICY "predictions_select_own" ON predictions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "predictions_select_pool_members" ON predictions FOR SELECT USING (
  public.user_in_pool(predictions.pool_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM pools p WHERE p.id = predictions.pool_id AND p.admin_id = auth.uid()
  )
);
CREATE POLICY "predictions_insert_own" ON predictions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "predictions_update_own_unlocked" ON predictions FOR UPDATE USING (user_id = auth.uid() AND is_locked = false);

CREATE POLICY "honor_pred_select_own" ON honor_predictions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "honor_pred_select_pool_members" ON honor_predictions FOR SELECT USING (
  public.user_in_pool(honor_predictions.pool_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM pools p WHERE p.id = honor_predictions.pool_id AND p.admin_id = auth.uid()
  )
);
CREATE POLICY "honor_pred_insert_own" ON honor_predictions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "honor_pred_update_own_open" ON honor_predictions FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "scoring_rules_select_pool" ON scoring_rules FOR SELECT USING (
  public.user_in_pool(scoring_rules.pool_id, auth.uid())
  OR EXISTS (SELECT 1 FROM pools p WHERE p.id = scoring_rules.pool_id AND p.admin_id = auth.uid())
);
CREATE POLICY "scoring_rules_insert_admin" ON scoring_rules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pools p WHERE p.id = scoring_rules.pool_id AND p.admin_id = auth.uid())
);

-- Donaciones: insert anónimo desde API (service role); sin select público
CREATE POLICY "donations_no_client_select" ON donations FOR SELECT USING (false);

-- Auditoría: sin acceso cliente
CREATE POLICY "audit_no_access" ON result_audit_log FOR SELECT USING (false);

-- Realtime: matches, pool_members (opcional, habilitar en dashboard Supabase)
