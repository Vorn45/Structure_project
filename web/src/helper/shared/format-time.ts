const formatTimeDifference = (diff: moment.Duration): string => {
    if (diff.asSeconds() < 0) {
        return `0 វិនាទីមុន`;
    } else if (diff.asSeconds() < 60) {
        return `${Math.floor(diff.asSeconds())} វិនាទីមុន`;
    } else if (diff.asMinutes() < 60) {
        return `${Math.floor(diff.asMinutes())} នាទីមុន`;
    } else if (diff.asHours() < 24) {
        return `${Math.floor(diff.asHours())} ម៉ោងមុន`;
    } else if (diff.asDays() < 7) {
        return `${Math.floor(diff.asDays())} ថ្ងៃមុន`;
    } else if (diff.asDays() < 365) {
        return `${Math.floor(diff.asDays() / 7)} សប្តាហ៍មុន`;
    } else {
        return `${Math.floor(diff.asYears())} ឆ្នាំមុន`;
    }
}

export default formatTimeDifference;