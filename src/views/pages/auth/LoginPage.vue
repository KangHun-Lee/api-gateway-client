<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useToastHelper } from '@/composables'
import { useI18n } from 'vue-i18n'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const { t } = useI18n()
const employeeNo = ref('')
const password = ref('')
const signInPassword = ref('')
const changedPassword = ref('')
const passcode = ref('')
const verificationCode = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()
const joinStatus = ref(false)
const authenticationStatus = ref(false)
const forgotPasswordStatus = ref(false)
const findPasswordStatus = ref(false)
const forgotPasswordAuthenticationStatus = ref(false)
const { successToast, errorToast } = useToastHelper()

const activeContainer = () => {
  return document.getElementById('container')?.classList.add('active')
}

const inactiveContainer = () => {
  return document.getElementById('container')?.classList.remove('active')
}

const signIn = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/login', {
      employeeNo: employeeNo.value,
      password: signInPassword.value
    })

    if (response.data.data === true) {
      authStore.setAuthenticated(true)
      const info = await axios.get('/api/auth/v1/my-info')

      authStore.setUser(info.data.data.user)
      authStore.setRoleList(info.data.data.roles)
      authStore.setScreenList(info.data.data.screens)
      successToast(t('api.auth.login.success'))
      router.push('/')
    }
  } catch (error) {
    errorToast(t('api.auth.login.error'))
  } finally {
    loading.value = false
  }
}

const signUp = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/sign-up', {
      employeeNo: employeeNo.value,
      password: password.value
    })

    if (response.data.data === 'true') {
      joinStatus.value = true
    }
  } catch (error: any) {
    errorToast(t(error.response.data.message))
  } finally {
    loading.value = false
  }
}

const authentication = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/authentication', {
      employeeNo: employeeNo.value,
      inputCode: passcode.value
    })

    if (response.data.data.authentication === true) {
      joinStatus.value = true
      authenticationStatus.value = true
      verificationCode.value = response.data.data.verificationCode
    }
  } catch (error) {
    errorToast(t('api.auth.mailAuthentication.error'))
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/create-user', {
      employeeNo: employeeNo.value,
      password: changedPassword.value,
      verificationCode: verificationCode.value
    })

    if (response.data.data === true) {
      successToast(t('api.auth.createUser.success'))
      inactiveContainer()
      joinStatus.value = false
      authenticationStatus.value = false
    }
  } catch (error) {
    errorToast(t('api.auth.createUser.error'))
  } finally {
    loading.value = false
  }
}

const forgotAuthentication = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/authentication', {
      employeeNo: employeeNo.value,
      inputCode: passcode.value
    })

    if (response.data.data.authentication === true) {
      forgotPasswordAuthenticationStatus.value = true
      verificationCode.value = response.data.data.verificationCode
    }
  } catch (error) {
    errorToast(t('api.auth.mailAuthentication.error'))
  } finally {
    loading.value = false
  }
}

const changePassword = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/change-password', {
      employeeNo: employeeNo.value,
      password: changedPassword.value,
      verificationCode: verificationCode.value
    })

    if (response.data.data === true) {
      successToast(t('api.auth.changePassword.success'))
      inactiveContainer()
      forgotPasswordStatus.value = false
      findPasswordStatus.value = false
      forgotPasswordAuthenticationStatus.value = false
    }
  } catch (error) {
    errorToast(t('api.auth.changePassword.error'))
  } finally {
    loading.value = false
  }
}

const forgotPassword = async () => {
  loading.value = true

  try {
    const response = await axios.post('/api/auth/v1/forgot-password', {
      employeeNo: employeeNo.value
    })

    console.log(response)
    if (response.data.data) {
      console.log('여기')
      findPasswordStatus.value = true
    }
  } catch (error: any) {
    errorToast(t(error.response.data.message))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="centered-container">
    <div class="login-container" id="container">
      <div class="login-form-container sign-up" v-if="!joinStatus">
        <form @submit.prevent="signUp">
          <h1>{{ t('view.login.join') }}</h1>
          <span>{{ t('view.login.joinWords') }}</span>
          <div class="sign-up-input">
            <FloatLabel variant="on">
              <InputText
                type="text"
                id="employeeNo"
                size="large"
                v-model="employeeNo"
                autocomplete="off"
                required
              />
              <label for="employeeNo">{{ t('view.login.id') }}</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText
                type="password"
                id="password"
                size="large"
                v-model="password"
                autocomplete="off"
                required
              />
              <label for="password">{{ t('view.login.password') }}</label>
            </FloatLabel>
            <Button
              type="submit"
              :label="t('view.login.join')"
              class="p-mt-3 p-button-rounded"
              :loading="loading"
            />
          </div>
        </form>
      </div>
      <div class="login-form-container sign-up" v-if="joinStatus && !authenticationStatus">
        <form @submit.prevent="authentication">
          <div class="sign-up-input">
            <h2>메일 인증</h2>
            <p>회원님의 메일로 인증 코드를 전송했습니다.</p>
            <InputOtp name="passcode" v-model="passcode" size="large" />
          </div>
          <Button type="submit" severity="secondary" label="인증하기" />
        </form>
      </div>
      <div class="login-form-container sign-up" v-if="joinStatus && authenticationStatus">
        <form @submit.prevent="createUser">
          <div class="sign-up-input">
            <h2>비밀번호 설정</h2>
            <p>사용할 비밀번호를 입력해 주세요.</p>
            <FloatLabel variant="on">
              <InputText
                type="password"
                id="changedPassword"
                size="large"
                v-model="changedPassword"
                autocomplete="off"
                required
              />
              <label for="changedPassword">{{ t('view.login.password') }}</label>
            </FloatLabel>
          </div>
          <Button type="submit" severity="secondary" label="비밀번호 설정" />
        </form>
      </div>
      <div class="login-form-container sign-in" v-if="forgotPasswordStatus && !findPasswordStatus">
        <form @submit.prevent="forgotPassword">
          <div class="login-input">
            <h2>비밀번호 찾기</h2>
            <p>사번을 입력해 주세요.</p>
            <FloatLabel variant="on">
              <InputText
                type="text"
                id="employeeNo"
                size="large"
                v-model="employeeNo"
                autocomplete="off"
                required
              />
              <label for="employeeNo">{{ t('view.login.id') }}</label>
            </FloatLabel>
          </div>
          <a @click="forgotPasswordStatus = false" style="cursor: pointer">{{
            t('view.login.backToLogin')
          }}</a>
          <Button type="submit" severity="secondary" label="비밀번호 찾기" />
        </form>
      </div>
      <div
        class="login-form-container sign-in"
        v-if="forgotPasswordStatus && findPasswordStatus && !forgotPasswordAuthenticationStatus"
      >
        <form @submit.prevent="forgotAuthentication">
          <div class="sign-up-input">
            <h2>메일 인증</h2>
            <p>회원님의 메일로 인증 코드를 전송했습니다.</p>
            <InputOtp name="passcode" v-model="passcode" size="large" />
          </div>
          <Button type="submit" severity="secondary" label="인증하기" />
        </form>
      </div>
      <div
        class="login-form-container sign-in"
        v-if="forgotPasswordStatus && findPasswordStatus && forgotPasswordAuthenticationStatus"
      >
        <form @submit.prevent="changePassword">
          <div class="sign-up-input">
            <h2>비밀번호 설정</h2>
            <p>사용할 비밀번호를 입력해 주세요.</p>
            <FloatLabel variant="on">
              <InputText
                type="password"
                id="changedPassword"
                size="large"
                v-model="changedPassword"
                autocomplete="off"
                required
              />
              <label for="changedPassword">{{ t('view.login.password') }}</label>
            </FloatLabel>
          </div>
          <Button type="submit" severity="secondary" label="비밀번호 설정" />
        </form>
      </div>
      <div class="login-form-container sign-in" v-if="!forgotPasswordStatus">
        <form @submit.prevent="signIn">
          <div class="logo-container">
            <img src="/logo_b.png" alt="OSSTEM Implant" class="logo-image" />
            <h2 class="p-card-title">Gateway</h2>
          </div>
          <div class="login-input">
            <FloatLabel variant="on">
              <InputText
                type="text"
                id="employeeNo"
                size="large"
                v-model="employeeNo"
                autocomplete="off"
                required
              />
              <label for="employeeNo">{{ t('view.login.id') }}</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText
                type="password"
                id="signInPassword"
                size="large"
                v-model="signInPassword"
                autocomplete="off"
                required
              />
              <label for="signInPassword">{{ t('view.login.password') }}</label>
            </FloatLabel>
            <a @click="forgotPasswordStatus = true" style="cursor: pointer">{{
              t('view.login.forgotPassword')
            }}</a>
            <Button
              type="submit"
              :label="t('view.login.login')"
              class="p-mt-3 p-button-rounded"
              :loading="loading"
            />
          </div>
        </form>
      </div>
      <div class="login-toggle-container">
        <div class="login-toggle">
          <div class="login-toggle-panel login-toggle-left">
            <h2>{{ t('view.login.signUpWords') }}</h2>
            <p>{{ t('view.login.signUpWordsDetail') }}</p>
            <Button class="hidden" id="login" @click="inactiveContainer">{{
              t('view.login.signIn')
            }}</Button>
          </div>
          <div class="login-toggle-panel login-toggle-right">
            <h2>{{ t('view.login.signInWords') }}</h2>
            <p>{{ t('view.login.signInWordsDetail') }}</p>
            <Button class="hidden" id="register" @click="activeContainer">{{
              t('view.login.signUp')
            }}</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo-container {
  text-align: center;
  margin-bottom: 20px;
}

.logo-image {
  width: 200px;
  height: auto;
  margin-bottom: 10px;
}
</style>
