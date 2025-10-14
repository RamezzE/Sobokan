import LevelBuilder from '@/components/LevelBuilder'

const CreateLevelPage = () => {
    return (
        <LevelBuilder onSave={(data) => console.log(data)} />
    )
}

export default CreateLevelPage;