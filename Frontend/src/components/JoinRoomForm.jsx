const JoinRoomForm = ({ onJoinRoom }) => {
    return (
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
            <div className="card-body">
                <h2 className="card-title">Tham gia phòng</h2>
                <div className="form-control">
                    <input 
                        type="text" 
                        placeholder="Nhập mã phòng" 
                        className="input input-bordered" 
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                                onJoinRoom(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default JoinRoomForm;
