drop extension if exists "pg_net";

drop trigger if exists "set_updated_at_contacts" on "public"."contacts";

drop trigger if exists "set_updated_at_developer_webhook_deliveries" on "public"."developer_webhook_deliveries";

drop trigger if exists "set_updated_at_paddle_events" on "public"."paddle_events";

drop trigger if exists "set_updated_at_payment_transactions" on "public"."payment_transactions";

drop trigger if exists "set_updated_at_rentals" on "public"."rentals";

drop trigger if exists "set_updated_at_verification_orders" on "public"."verification_orders";

drop trigger if exists "set_updated_at_verification_services" on "public"."verification_services";

drop policy "Service role has full access to contacts" on "public"."contacts";

drop policy "Users can view own contacts" on "public"."contacts";

drop policy "Service role has full access to credit accounts" on "public"."credit_accounts";

drop policy "Users can view own credit account" on "public"."credit_accounts";

drop policy "Service role has full access to credit locks" on "public"."credit_locks";

drop policy "Users can view own credit locks" on "public"."credit_locks";

drop policy "Service role has full access to credit transactions" on "public"."credit_transactions";

drop policy "Users can view own credit transactions" on "public"."credit_transactions";

drop policy "Service role has full access to developer webhook deliveries" on "public"."developer_webhook_deliveries";

drop policy "Service role has full access to paddle events" on "public"."paddle_events";

drop policy "Service role has full access to payment transactions" on "public"."payment_transactions";

drop policy "Users can view own payment transactions" on "public"."payment_transactions";

drop policy "Service role has full access to rentals" on "public"."rentals";

drop policy "Users can insert own rentals" on "public"."rentals";

drop policy "Users can update own rentals" on "public"."rentals";

drop policy "Users can view own rentals" on "public"."rentals";

drop policy "Service role has full access to verification orders" on "public"."verification_orders";

drop policy "Users can view own verification orders" on "public"."verification_orders";

drop policy "Anyone can view active verification services" on "public"."verification_services";

drop policy "Service role has full access to verification services" on "public"."verification_services";

drop policy "Service role has full access to wallet locks" on "public"."wallet_locks";

drop policy "Users can view own wallet locks" on "public"."wallet_locks";

revoke references on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke references on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke references on table "public"."credit_accounts" from "anon";

revoke trigger on table "public"."credit_accounts" from "anon";

revoke truncate on table "public"."credit_accounts" from "anon";

revoke references on table "public"."credit_accounts" from "authenticated";

revoke trigger on table "public"."credit_accounts" from "authenticated";

revoke truncate on table "public"."credit_accounts" from "authenticated";

revoke references on table "public"."credit_accounts" from "service_role";

revoke trigger on table "public"."credit_accounts" from "service_role";

revoke truncate on table "public"."credit_accounts" from "service_role";

revoke references on table "public"."credit_locks" from "anon";

revoke trigger on table "public"."credit_locks" from "anon";

revoke truncate on table "public"."credit_locks" from "anon";

revoke references on table "public"."credit_locks" from "authenticated";

revoke trigger on table "public"."credit_locks" from "authenticated";

revoke truncate on table "public"."credit_locks" from "authenticated";

revoke references on table "public"."credit_locks" from "service_role";

revoke trigger on table "public"."credit_locks" from "service_role";

revoke truncate on table "public"."credit_locks" from "service_role";

revoke references on table "public"."credit_pricing_logs" from "anon";

revoke trigger on table "public"."credit_pricing_logs" from "anon";

revoke truncate on table "public"."credit_pricing_logs" from "anon";

revoke references on table "public"."credit_pricing_logs" from "authenticated";

revoke trigger on table "public"."credit_pricing_logs" from "authenticated";

revoke truncate on table "public"."credit_pricing_logs" from "authenticated";

revoke references on table "public"."credit_pricing_logs" from "service_role";

revoke trigger on table "public"."credit_pricing_logs" from "service_role";

revoke truncate on table "public"."credit_pricing_logs" from "service_role";

revoke references on table "public"."credit_pricing_rules" from "anon";

revoke trigger on table "public"."credit_pricing_rules" from "anon";

revoke truncate on table "public"."credit_pricing_rules" from "anon";

revoke references on table "public"."credit_pricing_rules" from "authenticated";

revoke trigger on table "public"."credit_pricing_rules" from "authenticated";

revoke truncate on table "public"."credit_pricing_rules" from "authenticated";

revoke references on table "public"."credit_pricing_rules" from "service_role";

revoke trigger on table "public"."credit_pricing_rules" from "service_role";

revoke truncate on table "public"."credit_pricing_rules" from "service_role";

revoke references on table "public"."credit_transactions" from "anon";

revoke trigger on table "public"."credit_transactions" from "anon";

revoke truncate on table "public"."credit_transactions" from "anon";

revoke references on table "public"."credit_transactions" from "authenticated";

revoke trigger on table "public"."credit_transactions" from "authenticated";

revoke truncate on table "public"."credit_transactions" from "authenticated";

revoke references on table "public"."credit_transactions" from "service_role";

revoke trigger on table "public"."credit_transactions" from "service_role";

revoke truncate on table "public"."credit_transactions" from "service_role";

revoke references on table "public"."developer_webhook_deliveries" from "anon";

revoke trigger on table "public"."developer_webhook_deliveries" from "anon";

revoke truncate on table "public"."developer_webhook_deliveries" from "anon";

revoke references on table "public"."developer_webhook_deliveries" from "authenticated";

revoke trigger on table "public"."developer_webhook_deliveries" from "authenticated";

revoke truncate on table "public"."developer_webhook_deliveries" from "authenticated";

revoke references on table "public"."developer_webhook_deliveries" from "service_role";

revoke trigger on table "public"."developer_webhook_deliveries" from "service_role";

revoke truncate on table "public"."developer_webhook_deliveries" from "service_role";

revoke references on table "public"."paddle_events" from "anon";

revoke trigger on table "public"."paddle_events" from "anon";

revoke truncate on table "public"."paddle_events" from "anon";

revoke references on table "public"."paddle_events" from "authenticated";

revoke trigger on table "public"."paddle_events" from "authenticated";

revoke truncate on table "public"."paddle_events" from "authenticated";

revoke references on table "public"."paddle_events" from "service_role";

revoke trigger on table "public"."paddle_events" from "service_role";

revoke truncate on table "public"."paddle_events" from "service_role";

revoke references on table "public"."payment_transactions" from "anon";

revoke trigger on table "public"."payment_transactions" from "anon";

revoke truncate on table "public"."payment_transactions" from "anon";

revoke references on table "public"."payment_transactions" from "authenticated";

revoke trigger on table "public"."payment_transactions" from "authenticated";

revoke truncate on table "public"."payment_transactions" from "authenticated";

revoke references on table "public"."payment_transactions" from "service_role";

revoke trigger on table "public"."payment_transactions" from "service_role";

revoke truncate on table "public"."payment_transactions" from "service_role";

revoke references on table "public"."rentals" from "anon";

revoke trigger on table "public"."rentals" from "anon";

revoke truncate on table "public"."rentals" from "anon";

revoke references on table "public"."rentals" from "authenticated";

revoke trigger on table "public"."rentals" from "authenticated";

revoke truncate on table "public"."rentals" from "authenticated";

revoke references on table "public"."rentals" from "service_role";

revoke trigger on table "public"."rentals" from "service_role";

revoke truncate on table "public"."rentals" from "service_role";

revoke references on table "public"."verification_orders" from "anon";

revoke trigger on table "public"."verification_orders" from "anon";

revoke truncate on table "public"."verification_orders" from "anon";

revoke references on table "public"."verification_orders" from "authenticated";

revoke trigger on table "public"."verification_orders" from "authenticated";

revoke truncate on table "public"."verification_orders" from "authenticated";

revoke references on table "public"."verification_orders" from "service_role";

revoke trigger on table "public"."verification_orders" from "service_role";

revoke truncate on table "public"."verification_orders" from "service_role";

revoke references on table "public"."verification_services" from "anon";

revoke trigger on table "public"."verification_services" from "anon";

revoke truncate on table "public"."verification_services" from "anon";

revoke references on table "public"."verification_services" from "authenticated";

revoke trigger on table "public"."verification_services" from "authenticated";

revoke truncate on table "public"."verification_services" from "authenticated";

revoke references on table "public"."verification_services" from "service_role";

revoke trigger on table "public"."verification_services" from "service_role";

revoke truncate on table "public"."verification_services" from "service_role";

revoke references on table "public"."wallet_locks" from "anon";

revoke trigger on table "public"."wallet_locks" from "anon";

revoke truncate on table "public"."wallet_locks" from "anon";

revoke references on table "public"."wallet_locks" from "authenticated";

revoke trigger on table "public"."wallet_locks" from "authenticated";

revoke truncate on table "public"."wallet_locks" from "authenticated";

revoke references on table "public"."wallet_locks" from "service_role";

revoke trigger on table "public"."wallet_locks" from "service_role";

revoke truncate on table "public"."wallet_locks" from "service_role";

alter table "public"."api_keys" drop constraint "api_keys_workspace_id_fkey";

alter table "public"."audit_logs" drop constraint "audit_logs_workspace_id_fkey";

alter table "public"."contacts" drop constraint "contacts_user_id_fkey";

alter table "public"."contacts" drop constraint "contacts_user_phone_unique";

alter table "public"."credit_accounts" drop constraint "credit_accounts_user_id_fkey";

alter table "public"."credit_accounts" drop constraint "credit_accounts_user_id_key";

alter table "public"."credit_locks" drop constraint "credit_locks_user_id_fkey";

alter table "public"."credit_pricing_logs" drop constraint "credit_pricing_logs_user_id_fkey";

alter table "public"."credit_transactions" drop constraint "credit_transactions_idempotency_key_key";

alter table "public"."credit_transactions" drop constraint "credit_transactions_user_id_fkey";

alter table "public"."developer_webhook_deliveries" drop constraint "developer_webhook_deliveries_attempt_count_check";

alter table "public"."developer_webhook_deliveries" drop constraint "developer_webhook_deliveries_status_check";

alter table "public"."developer_webhook_deliveries" drop constraint "developer_webhook_deliveries_webhook_id_fkey";

alter table "public"."developer_webhook_deliveries" drop constraint "developer_webhook_deliveries_webhook_idempotency_unique";

alter table "public"."developer_webhooks" drop constraint "developer_webhooks_workspace_id_fkey";

alter table "public"."messages" drop constraint "messages_contact_id_fkey";

alter table "public"."messages" drop constraint "messages_type_check";

alter table "public"."paddle_events" drop constraint "paddle_events_event_id_key";

alter table "public"."paddle_events" drop constraint "paddle_events_user_id_fkey";

alter table "public"."payment_transactions" drop constraint "payment_transactions_reference_key";

alter table "public"."payment_transactions" drop constraint "payment_transactions_user_id_fkey";

alter table "public"."phone_numbers" drop constraint "phone_numbers_type_check";

alter table "public"."rentals" drop constraint "rentals_number_id_fkey";

alter table "public"."rentals" drop constraint "rentals_user_id_fkey";

alter table "public"."verification_orders" drop constraint "verification_orders_phone_number_id_fkey";

alter table "public"."verification_orders" drop constraint "verification_orders_price_usd_cents_check";

alter table "public"."verification_orders" drop constraint "verification_orders_service_id_fkey";

alter table "public"."verification_orders" drop constraint "verification_orders_status_check";

alter table "public"."verification_orders" drop constraint "verification_orders_user_id_fkey";

alter table "public"."verification_orders" drop constraint "verification_orders_user_idempotency_unique";

alter table "public"."verification_orders" drop constraint "verification_orders_wallet_lock_id_fkey";

alter table "public"."verification_services" drop constraint "verification_services_base_price_usd_cents_check";

alter table "public"."verification_services" drop constraint "verification_services_margin_usd_cents_check";

alter table "public"."verification_services" drop constraint "verification_services_service_code_key";

alter table "public"."wallet_locks" drop constraint "wallet_locks_idempotency_key_key";

alter table "public"."wallet_locks" drop constraint "wallet_locks_user_id_fkey";

alter table "public"."wallets" drop constraint "wallets_balance_usd_non_negative";

alter table "public"."wallets" drop constraint "wallets_locked_balance_usd_non_negative";

alter table "public"."calls" drop constraint "calls_status_check";

alter table "public"."esim_orders" drop constraint "esim_orders_status_check";

alter table "public"."phone_numbers" drop constraint "phone_numbers_status_check";

alter table "public"."phone_otp_sessions" drop constraint "phone_otp_sessions_status_check";

alter table "public"."proxy_orders" drop constraint "proxy_orders_status_check";

alter table "public"."vpn_sessions" drop constraint "vpn_sessions_status_check";

drop view if exists "public"."call_credit_accounts";

drop view if exists "public"."call_credit_locks";

drop view if exists "public"."call_credit_rates";

drop view if exists "public"."call_credit_transactions";

drop view if exists "public"."numbers";

alter table "public"."contacts" drop constraint "contacts_pkey";

alter table "public"."credit_accounts" drop constraint "credit_accounts_pkey";

alter table "public"."credit_locks" drop constraint "credit_locks_pkey";

alter table "public"."credit_pricing_logs" drop constraint "credit_pricing_logs_pkey";

alter table "public"."credit_pricing_rules" drop constraint "credit_pricing_rules_pkey";

alter table "public"."credit_transactions" drop constraint "credit_transactions_pkey";

alter table "public"."developer_webhook_deliveries" drop constraint "developer_webhook_deliveries_pkey";

alter table "public"."paddle_events" drop constraint "paddle_events_pkey";

alter table "public"."payment_transactions" drop constraint "payment_transactions_pkey";

alter table "public"."rentals" drop constraint "rentals_pkey";

alter table "public"."verification_orders" drop constraint "verification_orders_pkey";

alter table "public"."verification_services" drop constraint "verification_services_pkey";

alter table "public"."wallet_locks" drop constraint "wallet_locks_pkey";

drop index if exists "public"."contacts_pkey";

drop index if exists "public"."contacts_user_phone_unique";

drop index if exists "public"."credit_accounts_pkey";

drop index if exists "public"."credit_accounts_user_id_key";

drop index if exists "public"."credit_locks_pkey";

drop index if exists "public"."credit_pricing_logs_pkey";

drop index if exists "public"."credit_pricing_rules_pkey";

drop index if exists "public"."credit_transactions_idempotency_key_key";

drop index if exists "public"."credit_transactions_pkey";

drop index if exists "public"."developer_webhook_deliveries_pkey";

drop index if exists "public"."developer_webhook_deliveries_webhook_idempotency_unique";

drop index if exists "public"."idx_audit_logs_workspace_created";

drop index if exists "public"."idx_calls_idempotency_key";

drop index if exists "public"."idx_calls_provider_call_id";

drop index if exists "public"."idx_calls_provider_call_unique";

drop index if exists "public"."idx_calls_status";

drop index if exists "public"."idx_calls_user_idempotency_key";

drop index if exists "public"."idx_contacts_user_id";

drop index if exists "public"."idx_credit_locks_status";

drop index if exists "public"."idx_credit_locks_user_id";

drop index if exists "public"."idx_credit_pricing_logs_product";

drop index if exists "public"."idx_credit_pricing_rules_lookup";

drop index if exists "public"."idx_credit_transactions_related_product";

drop index if exists "public"."idx_credit_transactions_user_id";

drop index if exists "public"."idx_developer_webhook_deliveries_claimable";

drop index if exists "public"."idx_developer_webhook_deliveries_pending";

drop index if exists "public"."idx_esim_orders_provider_order";

drop index if exists "public"."idx_esim_orders_user_idempotency";

drop index if exists "public"."idx_esim_orders_user_status_created";

drop index if exists "public"."idx_messages_owner_thread";

drop index if exists "public"."idx_messages_provider_message_unique";

drop index if exists "public"."idx_messages_unread";

drop index if exists "public"."idx_paddle_events_processed";

drop index if exists "public"."idx_paddle_events_user_id";

drop index if exists "public"."idx_payment_transactions_reference";

drop index if exists "public"."idx_payment_transactions_status";

drop index if exists "public"."idx_payment_transactions_user_id";

drop index if exists "public"."idx_phone_numbers_provider_capability";

drop index if exists "public"."idx_phone_numbers_workspace_id";

drop index if exists "public"."idx_proxy_orders_provider_order";

drop index if exists "public"."idx_proxy_orders_user_idempotency";

drop index if exists "public"."idx_proxy_orders_user_status_created";

drop index if exists "public"."idx_rentals_status";

drop index if exists "public"."idx_rentals_user_id";

drop index if exists "public"."idx_subscription_entitlements_user_provider_identifier";

drop index if exists "public"."idx_verification_orders_provider_order";

drop index if exists "public"."idx_verification_orders_user_status";

drop index if exists "public"."idx_vpn_sessions_provider_session";

drop index if exists "public"."idx_vpn_sessions_user_idempotency";

drop index if exists "public"."idx_vpn_sessions_user_status_created";

drop index if exists "public"."idx_wallet_locks_related_product";

drop index if exists "public"."idx_wallet_locks_status";

drop index if exists "public"."idx_wallet_locks_user_id";

drop index if exists "public"."idx_wallet_transactions_idempotency_key";

drop index if exists "public"."paddle_events_event_id_key";

drop index if exists "public"."paddle_events_pkey";

drop index if exists "public"."payment_transactions_pkey";

drop index if exists "public"."payment_transactions_reference_key";

drop index if exists "public"."rentals_pkey";

drop index if exists "public"."verification_orders_pkey";

drop index if exists "public"."verification_orders_user_idempotency_unique";

drop index if exists "public"."verification_services_pkey";

drop index if exists "public"."verification_services_service_code_key";

drop index if exists "public"."wallet_locks_idempotency_key_key";

drop index if exists "public"."wallet_locks_pkey";

drop table "public"."contacts";

drop table "public"."credit_accounts";

drop table "public"."credit_locks";

drop table "public"."credit_pricing_logs";

drop table "public"."credit_pricing_rules";

drop table "public"."credit_transactions";

drop table "public"."developer_webhook_deliveries";

drop table "public"."paddle_events";

drop table "public"."payment_transactions";

drop table "public"."rentals";

drop table "public"."verification_orders";

drop table "public"."verification_services";

drop table "public"."wallet_locks";

alter table "public"."subscription_entitlements" alter column "provider" drop default;

alter table "public"."subscriptions" alter column "provider" drop default;

alter table "public"."subscriptions" alter column "status" drop default;

alter type "public"."subscription_provider" rename to "subscription_provider__old_version_to_be_dropped";

create type "public"."subscription_provider" as enum ('revenuecat');

alter type "public"."subscription_status" rename to "subscription_status__old_version_to_be_dropped";

create type "public"."subscription_status" as enum ('active', 'trialing', 'canceled', 'expired', 'billing_issue', 'paused', 'transferred', 'unknown');

alter table "public"."subscription_entitlements" alter column provider type "public"."subscription_provider" using provider::text::"public"."subscription_provider";

alter table "public"."subscriptions" alter column provider type "public"."subscription_provider" using provider::text::"public"."subscription_provider";

alter table "public"."subscriptions" alter column status type "public"."subscription_status" using status::text::"public"."subscription_status";

alter table "public"."subscription_entitlements" alter column "provider" set default 'revenuecat'::public.subscription_provider;

alter table "public"."subscriptions" alter column "provider" set default 'revenuecat'::public.subscription_provider;

alter table "public"."subscriptions" alter column "status" set default 'unknown'::public.subscription_status;

drop type "public"."subscription_provider__old_version_to_be_dropped";

drop type "public"."subscription_status__old_version_to_be_dropped";

alter table "public"."api_keys" drop column "is_active";

alter table "public"."api_keys" drop column "rate_limit";

alter table "public"."api_keys" drop column "scopes";

alter table "public"."api_keys" drop column "usage_count";

alter table "public"."api_keys" drop column "workspace_id";

alter table "public"."audit_logs" drop column "new_value";

alter table "public"."audit_logs" drop column "old_value";

alter table "public"."audit_logs" drop column "resource";

alter table "public"."audit_logs" drop column "workspace_id";

alter table "public"."calls" drop column "answered_at";

alter table "public"."calls" drop column "billable_seconds";

alter table "public"."calls" drop column "completed_at";

alter table "public"."calls" drop column "credits_locked";

alter table "public"."calls" drop column "credits_spent";

alter table "public"."calls" drop column "destination_country";

alter table "public"."calls" drop column "failure_reason";

alter table "public"."calls" drop column "idempotency_key";

alter table "public"."calls" drop column "started_at";

alter table "public"."calls" drop column "voicemail_url";

alter table "public"."credit_packages" drop column "base_credits";

alter table "public"."credit_packages" drop column "bonus_credits";

alter table "public"."credit_packages" drop column "sort_order";

alter table "public"."credit_packages" drop column "total_credits";

alter table "public"."credit_packages" drop column "usd_price_cents";

alter table "public"."developer_webhooks" drop column "delivery_failure_count";

alter table "public"."developer_webhooks" drop column "delivery_success_count";

alter table "public"."developer_webhooks" drop column "is_active";

alter table "public"."developer_webhooks" drop column "last_delivery_at";

alter table "public"."developer_webhooks" drop column "name";

alter table "public"."developer_webhooks" drop column "signing_secret";

alter table "public"."developer_webhooks" drop column "workspace_id";

alter table "public"."esim_orders" drop column "activation_data_encrypted";

alter table "public"."esim_orders" drop column "cancelled_at";

alter table "public"."esim_orders" drop column "failure_reason";

alter table "public"."esim_orders" drop column "idempotency_key";

alter table "public"."esim_orders" drop column "provider_order_id";

alter table "public"."esim_orders" drop column "refunded_at";

alter table "public"."messages" drop column "ai_classification";

alter table "public"."messages" drop column "contact_id";

alter table "public"."messages" drop column "extracted_otp";

alter table "public"."messages" drop column "is_spam";

alter table "public"."messages" drop column "num_segments";

alter table "public"."messages" drop column "read_at";

alter table "public"."messages" drop column "spam_score";

alter table "public"."messages" drop column "type";

alter table "public"."phone_numbers" drop column "area_code";

alter table "public"."phone_numbers" drop column "auto_renew";

alter table "public"."phone_numbers" drop column "auto_renew_at";

alter table "public"."phone_numbers" drop column "calls_received";

alter table "public"."phone_numbers" drop column "forwarding_config";

alter table "public"."phone_numbers" drop column "friendly_name";

alter table "public"."phone_numbers" drop column "price_usd_cents";

alter table "public"."phone_numbers" drop column "renewal_price_usd_cents";

alter table "public"."phone_numbers" drop column "sms_received";

alter table "public"."phone_numbers" drop column "sms_sent";

alter table "public"."phone_numbers" drop column "type";

alter table "public"."phone_numbers" drop column "workspace_id";

alter table "public"."phone_otp_sessions" drop column "channel";

alter table "public"."phone_otp_sessions" drop column "ip_address";

alter table "public"."phone_otp_sessions" drop column "verification_sid";

alter table "public"."phone_otp_sessions" alter column "otp_code_hash" set not null;

alter table "public"."proxy_orders" drop column "cancelled_at";

alter table "public"."proxy_orders" drop column "credentials_encrypted";

alter table "public"."proxy_orders" drop column "failure_reason";

alter table "public"."proxy_orders" drop column "idempotency_key";

alter table "public"."proxy_orders" drop column "provider_order_id";

alter table "public"."proxy_orders" drop column "renewal_at";

alter table "public"."users" drop column "lifetime_spend_usd_cents";

alter table "public"."users" drop column "wallet_balance_usd_cents";

alter table "public"."vpn_sessions" drop column "config_encrypted";

alter table "public"."vpn_sessions" drop column "device_name";

alter table "public"."vpn_sessions" drop column "failure_reason";

alter table "public"."vpn_sessions" drop column "idempotency_key";

alter table "public"."vpn_sessions" drop column "private_key_encrypted";

alter table "public"."vpn_sessions" drop column "provider_session_id";

alter table "public"."vpn_sessions" drop column "revoked_at";

alter table "public"."vpn_sessions" drop column "server_id";

alter table "public"."wallet_transactions" drop column "amount_usd_cents";

alter table "public"."wallet_transactions" drop column "balance_after_usd_cents";

alter table "public"."wallet_transactions" drop column "balance_before_usd_cents";

alter table "public"."wallet_transactions" drop column "idempotency_key";

alter table "public"."wallets" drop column "locked_balance_usd_cents";

alter table "public"."workspace_members" drop column "is_active";

alter table "public"."workspace_members" drop column "permissions";

alter table "public"."workspaces" drop column "is_active";

alter table "public"."workspaces" drop column "settings";

alter table "public"."workspaces" drop column "wallet_balance_usd_cents";

drop type "public"."credit_lock_status";

drop type "public"."credit_transaction_status";

drop type "public"."credit_transaction_type";

drop type "public"."wallet_lock_status";

CREATE UNIQUE INDEX subscription_entitlements_user_identifier_unique ON public.subscription_entitlements USING btree (user_id, identifier);

alter table "public"."subscription_entitlements" add constraint "subscription_entitlements_user_identifier_unique" UNIQUE using index "subscription_entitlements_user_identifier_unique";

alter table "public"."calls" add constraint "calls_status_check" CHECK ((status = ANY (ARRAY['initiated'::text, 'ringing'::text, 'in_progress'::text, 'completed'::text, 'failed'::text, 'busy'::text, 'no_answer'::text]))) not valid;

alter table "public"."calls" validate constraint "calls_status_check";

alter table "public"."esim_orders" add constraint "esim_orders_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."esim_orders" validate constraint "esim_orders_status_check";

alter table "public"."phone_numbers" add constraint "phone_numbers_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'released'::text]))) not valid;

alter table "public"."phone_numbers" validate constraint "phone_numbers_status_check";

alter table "public"."phone_otp_sessions" add constraint "phone_otp_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'expired'::text, 'failed'::text]))) not valid;

alter table "public"."phone_otp_sessions" validate constraint "phone_otp_sessions_status_check";

alter table "public"."proxy_orders" add constraint "proxy_orders_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'expired'::text]))) not valid;

alter table "public"."proxy_orders" validate constraint "proxy_orders_status_check";

alter table "public"."vpn_sessions" add constraint "vpn_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'disconnected'::text, 'expired'::text]))) not valid;

alter table "public"."vpn_sessions" validate constraint "vpn_sessions_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."abuse_events" to "anon";

grant insert on table "public"."abuse_events" to "anon";

grant select on table "public"."abuse_events" to "anon";

grant update on table "public"."abuse_events" to "anon";

grant delete on table "public"."abuse_events" to "authenticated";

grant insert on table "public"."abuse_events" to "authenticated";

grant select on table "public"."abuse_events" to "authenticated";

grant update on table "public"."abuse_events" to "authenticated";

grant delete on table "public"."abuse_events" to "service_role";

grant insert on table "public"."abuse_events" to "service_role";

grant select on table "public"."abuse_events" to "service_role";

grant update on table "public"."abuse_events" to "service_role";

grant delete on table "public"."api_keys" to "anon";

grant insert on table "public"."api_keys" to "anon";

grant select on table "public"."api_keys" to "anon";

grant update on table "public"."api_keys" to "anon";

grant delete on table "public"."api_keys" to "authenticated";

grant insert on table "public"."api_keys" to "authenticated";

grant select on table "public"."api_keys" to "authenticated";

grant update on table "public"."api_keys" to "authenticated";

grant delete on table "public"."api_keys" to "service_role";

grant insert on table "public"."api_keys" to "service_role";

grant select on table "public"."api_keys" to "service_role";

grant update on table "public"."api_keys" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."calls" to "anon";

grant insert on table "public"."calls" to "anon";

grant select on table "public"."calls" to "anon";

grant update on table "public"."calls" to "anon";

grant delete on table "public"."calls" to "authenticated";

grant insert on table "public"."calls" to "authenticated";

grant select on table "public"."calls" to "authenticated";

grant update on table "public"."calls" to "authenticated";

grant delete on table "public"."calls" to "service_role";

grant insert on table "public"."calls" to "service_role";

grant select on table "public"."calls" to "service_role";

grant update on table "public"."calls" to "service_role";

grant delete on table "public"."credit_packages" to "anon";

grant insert on table "public"."credit_packages" to "anon";

grant select on table "public"."credit_packages" to "anon";

grant update on table "public"."credit_packages" to "anon";

grant delete on table "public"."credit_packages" to "authenticated";

grant insert on table "public"."credit_packages" to "authenticated";

grant select on table "public"."credit_packages" to "authenticated";

grant update on table "public"."credit_packages" to "authenticated";

grant delete on table "public"."credit_packages" to "service_role";

grant insert on table "public"."credit_packages" to "service_role";

grant select on table "public"."credit_packages" to "service_role";

grant update on table "public"."credit_packages" to "service_role";

grant delete on table "public"."developer_webhooks" to "anon";

grant insert on table "public"."developer_webhooks" to "anon";

grant select on table "public"."developer_webhooks" to "anon";

grant update on table "public"."developer_webhooks" to "anon";

grant delete on table "public"."developer_webhooks" to "authenticated";

grant insert on table "public"."developer_webhooks" to "authenticated";

grant select on table "public"."developer_webhooks" to "authenticated";

grant update on table "public"."developer_webhooks" to "authenticated";

grant delete on table "public"."developer_webhooks" to "service_role";

grant insert on table "public"."developer_webhooks" to "service_role";

grant select on table "public"."developer_webhooks" to "service_role";

grant update on table "public"."developer_webhooks" to "service_role";

grant delete on table "public"."esim_orders" to "anon";

grant insert on table "public"."esim_orders" to "anon";

grant select on table "public"."esim_orders" to "anon";

grant update on table "public"."esim_orders" to "anon";

grant delete on table "public"."esim_orders" to "authenticated";

grant insert on table "public"."esim_orders" to "authenticated";

grant select on table "public"."esim_orders" to "authenticated";

grant update on table "public"."esim_orders" to "authenticated";

grant delete on table "public"."esim_orders" to "service_role";

grant insert on table "public"."esim_orders" to "service_role";

grant select on table "public"."esim_orders" to "service_role";

grant update on table "public"."esim_orders" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."payment_sessions" to "anon";

grant insert on table "public"."payment_sessions" to "anon";

grant select on table "public"."payment_sessions" to "anon";

grant update on table "public"."payment_sessions" to "anon";

grant delete on table "public"."payment_sessions" to "authenticated";

grant insert on table "public"."payment_sessions" to "authenticated";

grant select on table "public"."payment_sessions" to "authenticated";

grant update on table "public"."payment_sessions" to "authenticated";

grant delete on table "public"."payment_sessions" to "service_role";

grant insert on table "public"."payment_sessions" to "service_role";

grant select on table "public"."payment_sessions" to "service_role";

grant update on table "public"."payment_sessions" to "service_role";

grant delete on table "public"."phone_numbers" to "anon";

grant insert on table "public"."phone_numbers" to "anon";

grant select on table "public"."phone_numbers" to "anon";

grant update on table "public"."phone_numbers" to "anon";

grant delete on table "public"."phone_numbers" to "authenticated";

grant insert on table "public"."phone_numbers" to "authenticated";

grant select on table "public"."phone_numbers" to "authenticated";

grant update on table "public"."phone_numbers" to "authenticated";

grant delete on table "public"."phone_numbers" to "service_role";

grant insert on table "public"."phone_numbers" to "service_role";

grant select on table "public"."phone_numbers" to "service_role";

grant update on table "public"."phone_numbers" to "service_role";

grant delete on table "public"."phone_otp_sessions" to "anon";

grant insert on table "public"."phone_otp_sessions" to "anon";

grant select on table "public"."phone_otp_sessions" to "anon";

grant update on table "public"."phone_otp_sessions" to "anon";

grant delete on table "public"."phone_otp_sessions" to "authenticated";

grant insert on table "public"."phone_otp_sessions" to "authenticated";

grant select on table "public"."phone_otp_sessions" to "authenticated";

grant update on table "public"."phone_otp_sessions" to "authenticated";

grant delete on table "public"."phone_otp_sessions" to "service_role";

grant insert on table "public"."phone_otp_sessions" to "service_role";

grant select on table "public"."phone_otp_sessions" to "service_role";

grant update on table "public"."phone_otp_sessions" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."proxy_orders" to "anon";

grant insert on table "public"."proxy_orders" to "anon";

grant select on table "public"."proxy_orders" to "anon";

grant update on table "public"."proxy_orders" to "anon";

grant delete on table "public"."proxy_orders" to "authenticated";

grant insert on table "public"."proxy_orders" to "authenticated";

grant select on table "public"."proxy_orders" to "authenticated";

grant update on table "public"."proxy_orders" to "authenticated";

grant delete on table "public"."proxy_orders" to "service_role";

grant insert on table "public"."proxy_orders" to "service_role";

grant select on table "public"."proxy_orders" to "service_role";

grant update on table "public"."proxy_orders" to "service_role";

grant delete on table "public"."referrals" to "anon";

grant insert on table "public"."referrals" to "anon";

grant select on table "public"."referrals" to "anon";

grant update on table "public"."referrals" to "anon";

grant delete on table "public"."referrals" to "authenticated";

grant insert on table "public"."referrals" to "authenticated";

grant select on table "public"."referrals" to "authenticated";

grant update on table "public"."referrals" to "authenticated";

grant delete on table "public"."referrals" to "service_role";

grant insert on table "public"."referrals" to "service_role";

grant select on table "public"."referrals" to "service_role";

grant update on table "public"."referrals" to "service_role";

grant delete on table "public"."revenuecat_events" to "anon";

grant insert on table "public"."revenuecat_events" to "anon";

grant select on table "public"."revenuecat_events" to "anon";

grant update on table "public"."revenuecat_events" to "anon";

grant delete on table "public"."revenuecat_events" to "authenticated";

grant insert on table "public"."revenuecat_events" to "authenticated";

grant select on table "public"."revenuecat_events" to "authenticated";

grant update on table "public"."revenuecat_events" to "authenticated";

grant delete on table "public"."revenuecat_events" to "service_role";

grant insert on table "public"."revenuecat_events" to "service_role";

grant select on table "public"."revenuecat_events" to "service_role";

grant update on table "public"."revenuecat_events" to "service_role";

grant delete on table "public"."subscription_entitlements" to "anon";

grant insert on table "public"."subscription_entitlements" to "anon";

grant select on table "public"."subscription_entitlements" to "anon";

grant update on table "public"."subscription_entitlements" to "anon";

grant delete on table "public"."subscription_entitlements" to "authenticated";

grant insert on table "public"."subscription_entitlements" to "authenticated";

grant select on table "public"."subscription_entitlements" to "authenticated";

grant update on table "public"."subscription_entitlements" to "authenticated";

grant delete on table "public"."subscription_entitlements" to "service_role";

grant insert on table "public"."subscription_entitlements" to "service_role";

grant select on table "public"."subscription_entitlements" to "service_role";

grant update on table "public"."subscription_entitlements" to "service_role";

grant delete on table "public"."subscription_plans" to "anon";

grant insert on table "public"."subscription_plans" to "anon";

grant select on table "public"."subscription_plans" to "anon";

grant update on table "public"."subscription_plans" to "anon";

grant delete on table "public"."subscription_plans" to "authenticated";

grant insert on table "public"."subscription_plans" to "authenticated";

grant select on table "public"."subscription_plans" to "authenticated";

grant update on table "public"."subscription_plans" to "authenticated";

grant delete on table "public"."subscription_plans" to "service_role";

grant insert on table "public"."subscription_plans" to "service_role";

grant select on table "public"."subscription_plans" to "service_role";

grant update on table "public"."subscription_plans" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."user_subscriptions" to "anon";

grant insert on table "public"."user_subscriptions" to "anon";

grant select on table "public"."user_subscriptions" to "anon";

grant update on table "public"."user_subscriptions" to "anon";

grant delete on table "public"."user_subscriptions" to "authenticated";

grant insert on table "public"."user_subscriptions" to "authenticated";

grant select on table "public"."user_subscriptions" to "authenticated";

grant update on table "public"."user_subscriptions" to "authenticated";

grant delete on table "public"."user_subscriptions" to "service_role";

grant insert on table "public"."user_subscriptions" to "service_role";

grant select on table "public"."user_subscriptions" to "service_role";

grant update on table "public"."user_subscriptions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."velocity_counters" to "anon";

grant insert on table "public"."velocity_counters" to "anon";

grant select on table "public"."velocity_counters" to "anon";

grant update on table "public"."velocity_counters" to "anon";

grant delete on table "public"."velocity_counters" to "authenticated";

grant insert on table "public"."velocity_counters" to "authenticated";

grant select on table "public"."velocity_counters" to "authenticated";

grant update on table "public"."velocity_counters" to "authenticated";

grant delete on table "public"."velocity_counters" to "service_role";

grant insert on table "public"."velocity_counters" to "service_role";

grant select on table "public"."velocity_counters" to "service_role";

grant update on table "public"."velocity_counters" to "service_role";

grant delete on table "public"."verifications" to "anon";

grant insert on table "public"."verifications" to "anon";

grant select on table "public"."verifications" to "anon";

grant update on table "public"."verifications" to "anon";

grant delete on table "public"."verifications" to "authenticated";

grant insert on table "public"."verifications" to "authenticated";

grant select on table "public"."verifications" to "authenticated";

grant update on table "public"."verifications" to "authenticated";

grant delete on table "public"."verifications" to "service_role";

grant insert on table "public"."verifications" to "service_role";

grant select on table "public"."verifications" to "service_role";

grant update on table "public"."verifications" to "service_role";

grant delete on table "public"."vpn_sessions" to "anon";

grant insert on table "public"."vpn_sessions" to "anon";

grant select on table "public"."vpn_sessions" to "anon";

grant update on table "public"."vpn_sessions" to "anon";

grant delete on table "public"."vpn_sessions" to "authenticated";

grant insert on table "public"."vpn_sessions" to "authenticated";

grant select on table "public"."vpn_sessions" to "authenticated";

grant update on table "public"."vpn_sessions" to "authenticated";

grant delete on table "public"."vpn_sessions" to "service_role";

grant insert on table "public"."vpn_sessions" to "service_role";

grant select on table "public"."vpn_sessions" to "service_role";

grant update on table "public"."vpn_sessions" to "service_role";

grant delete on table "public"."wallet_transactions" to "anon";

grant insert on table "public"."wallet_transactions" to "anon";

grant select on table "public"."wallet_transactions" to "anon";

grant update on table "public"."wallet_transactions" to "anon";

grant delete on table "public"."wallet_transactions" to "authenticated";

grant insert on table "public"."wallet_transactions" to "authenticated";

grant select on table "public"."wallet_transactions" to "authenticated";

grant update on table "public"."wallet_transactions" to "authenticated";

grant delete on table "public"."wallet_transactions" to "service_role";

grant insert on table "public"."wallet_transactions" to "service_role";

grant select on table "public"."wallet_transactions" to "service_role";

grant update on table "public"."wallet_transactions" to "service_role";

grant delete on table "public"."wallets" to "anon";

grant insert on table "public"."wallets" to "anon";

grant select on table "public"."wallets" to "anon";

grant update on table "public"."wallets" to "anon";

grant delete on table "public"."wallets" to "authenticated";

grant insert on table "public"."wallets" to "authenticated";

grant select on table "public"."wallets" to "authenticated";

grant update on table "public"."wallets" to "authenticated";

grant delete on table "public"."wallets" to "service_role";

grant insert on table "public"."wallets" to "service_role";

grant select on table "public"."wallets" to "service_role";

grant update on table "public"."wallets" to "service_role";

grant delete on table "public"."webhook_dedup" to "anon";

grant insert on table "public"."webhook_dedup" to "anon";

grant select on table "public"."webhook_dedup" to "anon";

grant update on table "public"."webhook_dedup" to "anon";

grant delete on table "public"."webhook_dedup" to "authenticated";

grant insert on table "public"."webhook_dedup" to "authenticated";

grant select on table "public"."webhook_dedup" to "authenticated";

grant update on table "public"."webhook_dedup" to "authenticated";

grant delete on table "public"."webhook_dedup" to "service_role";

grant insert on table "public"."webhook_dedup" to "service_role";

grant select on table "public"."webhook_dedup" to "service_role";

grant update on table "public"."webhook_dedup" to "service_role";

grant delete on table "public"."workspace_members" to "anon";

grant insert on table "public"."workspace_members" to "anon";

grant select on table "public"."workspace_members" to "anon";

grant update on table "public"."workspace_members" to "anon";

grant delete on table "public"."workspace_members" to "authenticated";

grant insert on table "public"."workspace_members" to "authenticated";

grant select on table "public"."workspace_members" to "authenticated";

grant update on table "public"."workspace_members" to "authenticated";

grant delete on table "public"."workspace_members" to "service_role";

grant insert on table "public"."workspace_members" to "service_role";

grant select on table "public"."workspace_members" to "service_role";

grant update on table "public"."workspace_members" to "service_role";

grant delete on table "public"."workspaces" to "anon";

grant insert on table "public"."workspaces" to "anon";

grant select on table "public"."workspaces" to "anon";

grant update on table "public"."workspaces" to "anon";

grant delete on table "public"."workspaces" to "authenticated";

grant insert on table "public"."workspaces" to "authenticated";

grant select on table "public"."workspaces" to "authenticated";

grant update on table "public"."workspaces" to "authenticated";

grant delete on table "public"."workspaces" to "service_role";

grant insert on table "public"."workspaces" to "service_role";

grant select on table "public"."workspaces" to "service_role";

grant update on table "public"."workspaces" to "service_role";


  create policy "Users can insert own transactions"
  on "public"."wallet_transactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can insert own wallet"
  on "public"."wallets"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own wallet"
  on "public"."wallets"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



