"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DesignGraphic } from "@/components/design-assets";
import {
  Button,
  CompletionState,
  ErrorMessage,
  Field,
  Notice,
} from "@/components/ui";
import { api, DEMO_MODE, jsonBody, saveLogin } from "@/lib/api";
import { useMutation } from "@/lib/hooks";
import type { Account, LoginResponse } from "@/lib/types";
function EntryLogo() {
  return (
    <Link href="/" className="entry-logo" aria-label="시작 화면">
      <DesignGraphic name="logo" label="국민체육진흥공단" />
    </Link>
  );
}
export function Welcome() {
  return (
    <div className="entry-screen welcome">
      <EntryLogo />
      <div className="welcome-actions">
        <Link className="button primary" href="/login">
          로그인
        </Link>
        <Link className="button primary" href="/admin/login">
          관리자로 로그인
        </Link>
      </div>
    </div>
  );
}
export function AuthScreen({
  account = "user",
  register = false,
}: {
  account?: Account;
  register?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const mutation = useMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [superLogin, setSuperLogin] = useState(false);
  const [done, setDone] = useState(false);
  const loginPath = account === "admin" ? "/admin/login" : "/login";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (register && password !== confirm) {
      mutation.setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    await mutation.run(
      () =>
        api<LoginResponse>(
          `/auth/${account}/${register ? "register" : "login"}`,
          account,
          { method: "POST", body: jsonBody({ username, password }) },
          { public: true },
        ),
      (data) => {
        if (register) {
          setDone(true);
          return;
        }
        saveLogin(account, data);
        router.replace(
          data.initialSetupRequired
            ? account === "admin"
              ? "/admin/setup-region"
              : "/setup-region"
            : account === "admin"
              ? "/admin"
              : "/home",
        );
      },
    );
  }
  return (
    <div
      className={`entry-screen auth-screen ${register ? "register-screen" : ""}`}
    >
      <EntryLogo />
      {register && !done && (
        <h1 className="text-xl font-bold mb-5">
          {account === "admin" ? "관리자 " : ""}회원가입
        </h1>
      )}
      {done ? (
        <CompletionState
          title="회원가입이 완료되었습니다!"
          description="가입한 계정으로 로그인해 서비스를 시작하세요."
        >
          <Link className="button primary" href={loginPath}>
            로그인하기
          </Link>
        </CompletionState>
      ) : (
        <form onSubmit={submit} className="auth-form">
          {!register && params.get("reason") === "expired" && (
            <Notice tone="warning" className="mb-4">
              로그인이 만료되었습니다. 다시 로그인해주세요.
            </Notice>
          )}
          <label className="sr-only" htmlFor="username">
            아이디
          </label>
          <input
            id="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={register ? 4 : undefined}
            maxLength={50}
            pattern={register ? "[A-Za-z0-9._\\-]{4,50}" : undefined}
            title="4~50자의 영문, 숫자, 점, 밑줄, 하이픈"
            placeholder="아이디 입력하기"
          />
          <label className="sr-only" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            required
            type="password"
            minLength={register ? 8 : undefined}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="비밀번호 입력하기"
          />
          {register && (
            <Field label="비밀번호 확인">
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
              />
            </Field>
          )}
          <ErrorMessage message={mutation.error} />
          <Button className="auth-submit" busy={mutation.busy}>
            {register
              ? "회원가입"
              : superLogin
                ? "슈퍼 관리자 로그인"
                : "로그인"}
          </Button>
        </form>
      )}
      {!register && (
        <>
          <div className="auth-help">
            <Link href={account === "admin" ? "/admin/find-id" : "/find-id"}>
              아이디 찾기
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href={
                account === "admin" ? "/admin/find-password" : "/find-password"
              }
            >
              비밀번호 찾기
            </Link>
          </div>
          {account === "admin" && (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setSuperLogin((v) => !v)}
            >
              {superLogin ? "지역 관리자 로그인" : "슈퍼 관리자 로그인"}
            </Button>
          )}
          <Link
            className="auth-register"
            href={account === "admin" ? "/admin/register" : "/register"}
          >
            처음이신가요? 회원가입
          </Link>
        </>
      )}
      {register && !done && (
        <Link className="auth-register" href={loginPath}>
          이미 계정이 있어요 · 로그인
        </Link>
      )}
      {DEMO_MODE && !register && (
        <div className="demo-login">
          <p>샘플 계정으로 화면을 확인하세요.</p>
          <button
            className="text-link"
            onClick={() => {
              setUsername(
                account === "admin"
                  ? superLogin
                    ? "super-admin"
                    : "seoul-admin"
                  : "cheche_user",
              );
              setPassword("password123");
            }}
          >
            샘플 계정 입력
          </button>
        </div>
      )}
    </div>
  );
}

export function RecoveryScreen({
  account = "user",
  password = false,
}: {
  account?: Account;
  password?: boolean;
}) {
  const prefix = account === "admin" ? "/admin" : "";
  const title = password ? "비밀번호 찾기" : "아이디 찾기";
  return (
    <div className="entry-screen auth-screen recovery-screen">
      <EntryLogo />
      <nav className="recovery-tabs" aria-label="계정 찾기">
        <Link
          href={`${prefix}/find-id`}
          aria-current={!password ? "page" : undefined}
        >
          아이디 찾기
        </Link>
        <Link
          href={`${prefix}/find-password`}
          aria-current={password ? "page" : undefined}
        >
          비밀번호 찾기
        </Link>
      </nav>
      <div className="recovery-heading">
        <h1>
          {account === "admin" ? "관리자 " : ""}
          {title}
        </h1>
        <p>계정 확인에 필요한 정보를 입력해주세요.</p>
      </div>
      <form
        key={title}
        className="auth-form recovery-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field label={password ? "아이디" : "이름"}>
          <input
            autoComplete={password ? "username" : "name"}
            maxLength={50}
            placeholder={
              password ? "아이디를 입력해주세요" : "이름을 입력해주세요"
            }
          />
        </Field>
        <Field label="이메일">
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="이메일 주소를 입력해주세요"
          />
        </Field>
        <Button
          type="button"
          className="auth-submit"
          disabled
          aria-describedby="recovery-notice"
        >
          {password ? "비밀번호 재설정 안내 받기" : "아이디 찾기"}
        </Button>
        <p id="recovery-notice" className="recovery-notice">
          계정 찾기 기능은 준비 중입니다. 입력한 정보는 전송되지 않습니다.
        </p>
      </form>
      <Link className="auth-register" href={`${prefix}/login`}>
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
