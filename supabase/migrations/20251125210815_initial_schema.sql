

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_signature_questionnaires_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_signature_questionnaires_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."captured_symptoms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feeling_capture_id" "uuid" NOT NULL,
    "symptom_name" "text" NOT NULL,
    "symptom_intensity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "captured_symptoms_symptom_intensity_check" CHECK ((("symptom_intensity" >= 0) AND ("symptom_intensity" <= 5)))
);


ALTER TABLE "public"."captured_symptoms" OWNER TO "postgres";


COMMENT ON TABLE "public"."captured_symptoms" IS 'Individual symptoms captured (only values > 0)';



COMMENT ON COLUMN "public"."captured_symptoms"."symptom_name" IS 'Name of the symptom (Abdominal Pain, Fatigue, etc.)';



COMMENT ON COLUMN "public"."captured_symptoms"."symptom_intensity" IS 'Intensity from 0 to 5 (0 = no symptom, 1-5 = increasing intensity)';



CREATE TABLE IF NOT EXISTS "public"."consumptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "consumption_time" time without time zone NOT NULL,
    "consumption_date" "date" NOT NULL,
    "consumption_type" "text",
    "consumption" "text",
    "prep_mode" "text",
    "after_effects" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consumptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diagnosis_symptom_catalogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "diagnosis" "text" NOT NULL,
    "symptom_catalog" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."diagnosis_symptom_catalogs" OWNER TO "postgres";


COMMENT ON TABLE "public"."diagnosis_symptom_catalogs" IS 'Reference catalog of symptoms by medical diagnosis';



COMMENT ON COLUMN "public"."diagnosis_symptom_catalogs"."diagnosis" IS 'Medical diagnosis name (crohn, ulcerative_colitis, etc.)';



COMMENT ON COLUMN "public"."diagnosis_symptom_catalogs"."symptom_catalog" IS 'JSON catalog of default symptoms for this diagnosis';



CREATE TABLE IF NOT EXISTS "public"."feeling_captures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "global_feeling" "text" NOT NULL,
    "capture_date" "date" NOT NULL,
    "capture_time" time without time zone NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feeling_captures_global_feeling_check" CHECK (("global_feeling" = ANY (ARRAY['bad'::"text", 'ok'::"text", 'good'::"text", 'excellent'::"text"])))
);


ALTER TABLE "public"."feeling_captures" OWNER TO "postgres";


COMMENT ON TABLE "public"."feeling_captures" IS 'Global feeling capture sessions';



COMMENT ON COLUMN "public"."feeling_captures"."global_feeling" IS 'Overall feeling: bad, ok, good, excellent';



COMMENT ON COLUMN "public"."feeling_captures"."capture_date" IS 'Date of the capture';



COMMENT ON COLUMN "public"."feeling_captures"."capture_time" IS 'Time of the capture';



COMMENT ON COLUMN "public"."feeling_captures"."notes" IS 'Optional user notes';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "birth_date" "date",
    "gender" "text",
    "diagnosis" "text" NOT NULL,
    "is_profile_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "symptom_catalog" "jsonb" DEFAULT '[{"key": "abdominal_pain", "icon": "User", "label": "Douleur abdominale", "order": 1, "enabled": true}, {"key": "bloating", "icon": "Wind", "label": "Ballonnements", "order": 2, "enabled": true}, {"key": "joint_pain", "icon": "Zap", "label": "Douleur articulaire", "order": 3, "enabled": true}, {"key": "fatigue", "icon": "Frown", "label": "Fatigue", "order": 4, "enabled": true}, {"key": "stress", "icon": "Brain", "label": "Stress", "order": 5, "enabled": true}, {"key": "sleep_quality", "icon": "Moon", "label": "Qualité du sommeil", "order": 6, "enabled": true}]'::"jsonb",
    "rectocolite_signature" "text",
    "last_calprotectin_value" integer,
    "last_calprotectin_date" "date",
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."symptom_catalog" IS 'Catalogue des symptômes personnalisé par utilisateur. Structure: [{"key": "nom_symptome", "label": "Libellé affiché", "icon": "NomIcone", "enabled": boolean, "order": number}]';



CREATE TABLE IF NOT EXISTS "public"."signature_questionnaires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "responses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "calculated_signature" "text",
    "confidence_score" integer DEFAULT 0,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."signature_questionnaires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "consistency" integer NOT NULL,
    "stool_date" "date" NOT NULL,
    "stool_time" time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "blood_level" character varying(25),
    "mucus_level" character varying(25),
    "stool_color" character varying(25),
    "evacuation_effort" character varying(25),
    "duration_minutes" integer,
    "pain_level" integer,
    "notes" "text",
    "urgence" integer DEFAULT 0,
    CONSTRAINT "check_urgence_values" CHECK ((("urgence" >= 0) AND ("urgence" <= 2))),
    CONSTRAINT "stools_consistency_check" CHECK ((("consistency" >= 0) AND ("consistency" <= 10)))
);


ALTER TABLE "public"."stools" OWNER TO "postgres";


COMMENT ON COLUMN "public"."stools"."urgence" IS 'Niveau d''urgence: 0=Aucune, 1=Modérée, 2=Sévère';



CREATE TABLE IF NOT EXISTS "public"."treatments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "dosage" "text" DEFAULT ''::"text",
    "frequency" "text" DEFAULT ''::"text",
    "start_date" "date",
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatments" OWNER TO "postgres";


ALTER TABLE ONLY "public"."captured_symptoms"
    ADD CONSTRAINT "captured_symptoms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumptions"
    ADD CONSTRAINT "consumptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnosis_symptom_catalogs"
    ADD CONSTRAINT "diagnosis_symptom_catalogs_diagnosis_key" UNIQUE ("diagnosis");



ALTER TABLE ONLY "public"."diagnosis_symptom_catalogs"
    ADD CONSTRAINT "diagnosis_symptom_catalogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feeling_captures"
    ADD CONSTRAINT "feeling_captures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."signature_questionnaires"
    ADD CONSTRAINT "signature_questionnaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stools"
    ADD CONSTRAINT "stools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatments"
    ADD CONSTRAINT "treatments_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_captured_symptoms_feeling_capture_id" ON "public"."captured_symptoms" USING "btree" ("feeling_capture_id");



CREATE INDEX "idx_captured_symptoms_intensity" ON "public"."captured_symptoms" USING "btree" ("symptom_intensity");



CREATE INDEX "idx_captured_symptoms_symptom_name" ON "public"."captured_symptoms" USING "btree" ("symptom_name");



CREATE INDEX "idx_diagnosis_symptom_catalogs_diagnosis" ON "public"."diagnosis_symptom_catalogs" USING "btree" ("diagnosis");



CREATE INDEX "idx_diagnosis_symptom_catalogs_symptom_catalog" ON "public"."diagnosis_symptom_catalogs" USING "gin" ("symptom_catalog");



CREATE INDEX "idx_feeling_captures_capture_date" ON "public"."feeling_captures" USING "btree" ("capture_date");



CREATE INDEX "idx_feeling_captures_global_feeling" ON "public"."feeling_captures" USING "btree" ("global_feeling");



CREATE INDEX "idx_feeling_captures_profile_date" ON "public"."feeling_captures" USING "btree" ("profile_id", "capture_date");



CREATE INDEX "idx_feeling_captures_profile_id" ON "public"."feeling_captures" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_symptom_catalog" ON "public"."profiles" USING "gin" ("symptom_catalog");



CREATE INDEX "idx_stools_urgence" ON "public"."stools" USING "btree" ("urgence");



CREATE OR REPLACE TRIGGER "update_captured_symptoms_updated_at" BEFORE UPDATE ON "public"."captured_symptoms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_diagnosis_symptom_catalogs_updated_at" BEFORE UPDATE ON "public"."diagnosis_symptom_catalogs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_feeling_captures_updated_at" BEFORE UPDATE ON "public"."feeling_captures" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_signature_questionnaires_updated_at" BEFORE UPDATE ON "public"."signature_questionnaires" FOR EACH ROW EXECUTE FUNCTION "public"."update_signature_questionnaires_updated_at"();



CREATE OR REPLACE TRIGGER "update_stools_updated_at" BEFORE UPDATE ON "public"."stools" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_treatments_updated_at" BEFORE UPDATE ON "public"."treatments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."captured_symptoms"
    ADD CONSTRAINT "captured_symptoms_feeling_capture_id_fkey" FOREIGN KEY ("feeling_capture_id") REFERENCES "public"."feeling_captures"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consumptions"
    ADD CONSTRAINT "consumptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feeling_captures"
    ADD CONSTRAINT "feeling_captures_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signature_questionnaires"
    ADD CONSTRAINT "signature_questionnaires_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stools"
    ADD CONSTRAINT "stools_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatments"
    ADD CONSTRAINT "treatments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "All access for connected profile" ON "public"."consumptions" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own stools" ON "public"."stools" FOR DELETE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own treatments" ON "public"."treatments" FOR DELETE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own questionnaires" ON "public"."signature_questionnaires" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own stools" ON "public"."stools" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own treatments" ON "public"."treatments" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own questionnaires" ON "public"."signature_questionnaires" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own stools" ON "public"."stools" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can read own treatments" ON "public"."treatments" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own questionnaires" ON "public"."signature_questionnaires" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))) WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own stools" ON "public"."stools" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))) WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own treatments" ON "public"."treatments" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))) WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."captured_symptoms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "captured_symptoms_delete" ON "public"."captured_symptoms" FOR DELETE TO "authenticated" USING (("feeling_capture_id" IN ( SELECT "feeling_captures"."id"
   FROM "public"."feeling_captures"
  WHERE ("feeling_captures"."profile_id" IN ( SELECT "profiles"."id"
           FROM "public"."profiles"
          WHERE ("profiles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "captured_symptoms_insert" ON "public"."captured_symptoms" FOR INSERT TO "authenticated" WITH CHECK (("feeling_capture_id" IN ( SELECT "feeling_captures"."id"
   FROM "public"."feeling_captures"
  WHERE ("feeling_captures"."profile_id" IN ( SELECT "profiles"."id"
           FROM "public"."profiles"
          WHERE ("profiles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "captured_symptoms_select" ON "public"."captured_symptoms" FOR SELECT TO "authenticated" USING (("feeling_capture_id" IN ( SELECT "feeling_captures"."id"
   FROM "public"."feeling_captures"
  WHERE ("feeling_captures"."profile_id" IN ( SELECT "profiles"."id"
           FROM "public"."profiles"
          WHERE ("profiles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "captured_symptoms_update" ON "public"."captured_symptoms" FOR UPDATE TO "authenticated" USING (("feeling_capture_id" IN ( SELECT "feeling_captures"."id"
   FROM "public"."feeling_captures"
  WHERE ("feeling_captures"."profile_id" IN ( SELECT "profiles"."id"
           FROM "public"."profiles"
          WHERE ("profiles"."user_id" = "auth"."uid"())))))) WITH CHECK (("feeling_capture_id" IN ( SELECT "feeling_captures"."id"
   FROM "public"."feeling_captures"
  WHERE ("feeling_captures"."profile_id" IN ( SELECT "profiles"."id"
           FROM "public"."profiles"
          WHERE ("profiles"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."consumptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diagnosis_symptom_catalogs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diagnosis_symptom_catalogs_select" ON "public"."diagnosis_symptom_catalogs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."feeling_captures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feeling_captures_delete" ON "public"."feeling_captures" FOR DELETE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "feeling_captures_insert" ON "public"."feeling_captures" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "feeling_captures_select" ON "public"."feeling_captures" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "feeling_captures_update" ON "public"."feeling_captures" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))) WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "insert" ON "public"."consumptions" FOR INSERT WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select" ON "public"."consumptions" FOR SELECT USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."signature_questionnaires" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatments" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_signature_questionnaires_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_signature_questionnaires_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_signature_questionnaires_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."captured_symptoms" TO "anon";
GRANT ALL ON TABLE "public"."captured_symptoms" TO "authenticated";
GRANT ALL ON TABLE "public"."captured_symptoms" TO "service_role";



GRANT ALL ON TABLE "public"."consumptions" TO "anon";
GRANT ALL ON TABLE "public"."consumptions" TO "authenticated";
GRANT ALL ON TABLE "public"."consumptions" TO "service_role";



GRANT ALL ON TABLE "public"."diagnosis_symptom_catalogs" TO "anon";
GRANT ALL ON TABLE "public"."diagnosis_symptom_catalogs" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnosis_symptom_catalogs" TO "service_role";



GRANT ALL ON TABLE "public"."feeling_captures" TO "anon";
GRANT ALL ON TABLE "public"."feeling_captures" TO "authenticated";
GRANT ALL ON TABLE "public"."feeling_captures" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."signature_questionnaires" TO "anon";
GRANT ALL ON TABLE "public"."signature_questionnaires" TO "authenticated";
GRANT ALL ON TABLE "public"."signature_questionnaires" TO "service_role";



GRANT ALL ON TABLE "public"."stools" TO "anon";
GRANT ALL ON TABLE "public"."stools" TO "authenticated";
GRANT ALL ON TABLE "public"."stools" TO "service_role";



GRANT ALL ON TABLE "public"."treatments" TO "anon";
GRANT ALL ON TABLE "public"."treatments" TO "authenticated";
GRANT ALL ON TABLE "public"."treatments" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
