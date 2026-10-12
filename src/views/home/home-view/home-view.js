import AppButton from '@/components/app-button/app-button.vue'
import photo from '../../../../assets/adecd56e-21d0-4b77-a765-ddb3ece0772c.png'

export default {
  name: 'HomeView',
  components: {
    AppButton
  },
  data() {
    return {
      photo
    }
  },
  methods: {
    book() {
      this.$router.push('/calendar')
    }
  }
}
